# coding=UTF-8

import os
import re
import sys
import traceback
import urllib
import logging
import Cookie
import json

from google.appengine.api import users
from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

# Closure Library の JavaScript ファイルの依存関係を読み込む
execfile('deps.py')

logging.getLogger().setLevel(logging.DEBUG)

# リクエストエラーの例外
class HttpError(RuntimeError):
  def __init__(self, code):
    self.code_ = code

  def get_code(self):
    return self.code_

  def __str__(self):
    return "HTTP ERROR : STATUS %d" % (self.code_)


# Closure Library の JavaScript ファイルの依存関係を展開する
class ClosureBuilder(object):
  MEMCACHE_PREFIX = 'r_'

  def build(self, requires):
    requires.sort()
    requires_str = unicode(','.join(requires))
    cachekey     = self.__class__.MEMCACHE_PREFIX + hex(requires_str.__hash__())
    cache        = memcache.get(cachekey)
    if cache is not None:
      cache = json.loads(cache)
    else:
      logging.info('Required modules is not cached.')
      cache = {}
    if 'requires' in cache and unicode(cache['requires']) == requires_str:
      self.jsfiles = [cache['code']]
      self.errors  = cache['errors']
    else:
      logging.info('Build required modules.')
      self.read    = {}
      self.jsfiles = ['window.CLOSURE_NO_DEPS = true;']
      self.errors  = []
      self.load_file('closurejs/closure/goog/base.js')
      self.load('goog.debug.Logger')
      self.load('goog.debug.LogManager')
      self.load('goog.debug.ErrorHandler')
      for cname in requires:
        self.load(cname)
      cache = {
        'requires': requires_str,
        'code':     self.get_code(),
        'errors':   self.get_errors() }
      memcache.set(cachekey, json.dumps(cache))

  def load(self, cname):
    if cname in self.read:
      return []
    self.read[cname] = True
    if cname not in closure_classes:
      self.errors.append(cname + ' is not exist.')
      return
    fname              = closure_classes[cname]
    provides, requires = closure_files[fname]
    for c in provides:
      self.read[c] = True
    for c in requires:
      self.load(c)
    self.load_file(fname)

  def load_file(self, fname):
    try:
      self.jsfiles.append(open(fname).read())
    except:
      self.errors.append('Failed to load ' + fname)

  def get_code(self):
    return "\n".join(self.jsfiles)

  def get_errors(self):
    return self.errors


class UserData(db.Model):
  projects    = db.TextProperty(default='{}')
  last_access = db.DateTimeProperty(auto_now=True)

  def get_projects(self):
    return json.loads(self.projects)

  def set_projects(self, projects):
    self.projects = json.dumps(projects)

  def set_project(self, name, project):
    obj      = self.get_projects()
    key      = project.project_id()
    obj[key] = { 'n': name }
    self.projects = json.dumps(obj)
    return key

  def id_or_name(self):
    return self.key().id_or_name()

  @classmethod
  def get_user_data_safe(cls, user):
    return db.run_in_transaction(cls.get_user_data_safe_sub, user)

  @classmethod
  def get_user_data_safe_sub(cls, user):
    entity = cls.get_by_key_name(user.user_id()) or cls(key_name=user.user_id())
    entity.put()
    return entity

class Project(db.Model):
  PUBLIC_PROJECT_Q = None
  PREFIX_PRIVATE   = 'u'
  PREFIX_PUBLIC    = 's'

  name     = db.StringProperty()
  jscode   = db.TextProperty()
  htmlcode = db.TextProperty()

  def project_id(self):
    prefix = Project.PREFIX_PUBLIC
    if self.parent_key():
      prefix = Project.PREFIX_PRIVATE
    return '%s_%x' % (prefix, self.key().id())

  def load_from_dict(self, data, public):
    if 'n' in data and public:
      self.name = data['n'] or ''
    if 'j' in data:
      self.jscode = data['j'] or ''
    if 'h' in data:
      self.htmlcode = data['h'] or ''

  @classmethod
  def get_by_project_id(cls, project_id, user_id):
    type, sep, project_id = project_id.partition('_')
    if project_id:
      if type == cls.PREFIX_PUBLIC:
        key = db.Key.from_path(cls.kind(), int(project_id, 16))
      elif type == cls.PREFIX_PRIVATE:
        if not user_id:
          return None
        key = db.Key.from_path('UserData', user_id, cls.kind(), int(project_id, 16))
      else:
        logging.error('Unknown project id prefix.')
        return None
      return cls.get(key)
    else:
      return None

  @classmethod
  def get_by_project_id_safe(cls, project_id, user_id):
    project = cls.get_by_project_id(project_id, user_id)
    if not project:
      raise HttpError(404)
    return project

  @classmethod
  def get_public_projects(cls):
    return cls.PUBLIC_PROJECT_Q.fetch(1000)

  @classmethod
  def delete_by_project_id(cls, project_id, user_id):
    type, sep, project_id = project_id.partition('_')
    if project_id:
      if type == cls.PREFIX_PUBLIC:
        key = db.Key.from_path(cls.kind(), int(project_id, 16))
      elif type == cls.PREFIX_PRIVATE:
        if not user_id:
          return
        key = db.Key.from_path('UserData', user_id, cls.kind(), int(project_id, 16))
      else:
        logging.error('Unknown project id prefix.')
        return
      db.delete(key)
    else:
      return

Project.PUBLIC_PROJECT_Q = Project.gql('WHERE name != NULL')


class BaseHandler(webapp.RequestHandler):
  def getCookie(self):
    return Cookie.SimpleCookie(self.request.headers.get('cookie', ''))

  def validate_request(self, req_body, require_fields):
    for field in require_fields:
      if field not in req_body:
        raise HttpError(500)
    type = self.request.headers.get('Content-Type', '')
    if req_body and type.find('application/json') < 0:
      raise HttpError(400)

  def get_project_id(self):
    project_id = self.request.get('id', None)
    if not project_id:
      raise HttpError(404)
    return project_id

  def get_user_data(self):
    user = users.get_current_user()
    if not user:
      raise HttpError(403)
    user_data = UserData.get_by_key_name(user.user_id())
    if not user_data:
      raise HttpError(403)
    return user_data

  def handle_exception(self, exception, debug_mode):
    if isinstance(exception, HttpError):
      self.error(exception.get_code())
      self.response.headers['Content-Type'] = 'text/plain'
      if debug_mode:
        self.response.out.write(
          ''.join(traceback.format_exception(*sys.exc_info())))
      else:
        self.response.out.write('Error')
    else:
      super(BaseHandler, self).handle_exception(exception, debug_mode)


class TopPageHandler(BaseHandler):
  SANITIZE_PROJECTID_RE = re.compile(r'[^0-9A-Za-z_]')
  MEMCACHE_PREFIX       = 's_'

  def get(self):
    user      = users.get_current_user()
    ck_pid    = None
    user_name = None
    user_type = self.get_user_type(user)
    projects  = '{}'
    if user:
      ck_pid    = self.getCookie().get('ck_pid', None)
      ck_pid    = ck_pid and ck_pid.value
      user_data = UserData.get_user_data_safe(user)
      user_name = user.email()
      projects  = user_data.projects or '{}'
      if ck_pid and ck_pid[0] == Project.PREFIX_PRIVATE:
        entries = json.loads(projects)
        entry   = entries.get(ck_pid, None)
        project = entry and Project.get_by_project_id(ck_pid, user_data.id_or_name())
        if project:
          entry['j'] = project.jscode
          entry['h'] = project.htmlcode
          projects   = json.dumps(entries)
    params = {
      'login_url':  users.create_login_url(self.request.url),
      'logout_url': users.create_logout_url(self.request.url),
      'user_name':  user_name,
      'user_type':  user_type,
      'fake_utype': self.request.get('user', user_type),
      'project_id': 'null',
      'samples':    self.fetch_samples(ck_pid).replace('/', "\\/"),
      'projects':   projects.replace('/', "\\/") }
    if ck_pid:
      params['project_id'] = '"' + re.sub(self.SANITIZE_PROJECTID_RE, '', ck_pid) + '"'
    html = template.render('index.html', params)
    self.response.out.write(html)

  def get_user_type(self, user):
    if users.is_current_user_admin():
      return 'admin'
    elif user:
      return 'user'
    else:
      return 'guest'

  def fetch_samples(self, ck_pid):
    cache_key = self.__class__.MEMCACHE_PREFIX + 'index'
    if ck_pid and ck_pid[0] == Project.PREFIX_PUBLIC:
      cache_key = self.__class__.MEMCACHE_PREFIX + ck_pid
    cache = memcache.get(cache_key)
    if cache is not None:
      return cache
    logging.info('Fetch all public projects.')
    projects = Project.get_public_projects()
    result   = {}
    for project in projects:
      project_id = project.project_id()
      entry      = { 'n': project.name }
      if project_id == ck_pid:
        entry['j'] = project.jscode
        entry['h'] = project.htmlcode
      result[project_id] = entry
    result = json.dumps(result)
    memcache.set(cache_key, result, 60*60*24)
    return result


class CompileHandler(BaseHandler):
  MEMCACHE_PREFIX = 'c_'

  def post(self):
    self.compile_js()

  def put(self):
    self.compile_js()

  def compile_js(self):
    if self.request.headers.get('Content-Type', '').find('text/javascript') < 0:
      raise HttpError(400)
    jsSrc = unicode(self.request.body.strip(), 'utf-8')
    cache = memcache.get(self.__class__.MEMCACHE_PREFIX + jsSrc)
    if cache is not None:
      cache = json.loads(cache)
    else:
      cache = {}
    if not ('src' in cache and unicode(cache['src']) == jsSrc):
      logging.info('Request to Closure Compiler Service.')
      rpc    = self.request_compilation(jsSrc)
      result = rpc.get_result()
      if result.status_code == 200:
        cache = json.loads(result.content)
        cache['src'] = jsSrc
      else:
        cache = {
          'src': jsSrc,
          'compiledCode': '',
          'errors': [{'lineno': 0, 'error': 'Compilation request is failed.'}] }
      memcache.set(self.__class__.MEMCACHE_PREFIX + jsSrc, json.dumps(cache))
    del cache['src']
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(cache))

  def request_compilation(self, code):
    headers = {
      'Content-Type': 'application/x-www-form-urlencoded' }
    form_fields = {
      'js_code':             code.encode('utf-8'),
      'compilation_level':   'ADVANCED_OPTIMIZATIONS',
      'output_format':       'json',
      'use_closure_library': 'true',
      'formatting':          'pretty_print' }
    output_info = 'output_info=compiled_code&output_info=warnings&output_info=errors&'
    rpc = urlfetch.create_rpc(deadline=10)
    urlfetch.make_fetch_call(rpc=rpc,
                             url='http://closure-compiler.appspot.com/compile',
                             payload=output_info + logging_code + urllib.urlencode(form_fields),
                             method=urlfetch.POST,
                             headers=headers)
    return rpc


class ProjectsHandler(BaseHandler):
  def get(self):
    key = self.get_project_id()
    if key[0] == Project.PREFIX_PRIVATE:
      user_data = self.get_user_data()
      user_id   = user_data and user_data.id_or_name()
      project   = Project.get_by_project_id(key, user_id)
    elif key[0] == Project.PREFIX_PUBLIC:
      project = Project.get_by_project_id(key, None)
    if not project:
      raise HttpError(404)
    self.output_json({ 'j': project.jscode, 'h': project.htmlcode })

  def post(self):
    req_body = json.loads(self.request.body)
    self.validate_request(req_body, ('n', 'j', 'h'))
    self.output_json(db.run_in_transaction(self.handle_post, req_body))

  def handle_post(self, req_body):
    user_data = self.get_user_data()
    project   = Project(parent  = user_data,
                        jscode  = req_body.get('j', ''),
                        htmlcode= req_body.get('h', ''))
    project.put()
    key = user_data.set_project(req_body.get('n', ''), project)
    user_data.put()
    return { 'id': key }

  def put(self):
    key      = self.get_project_id()
    req_body = json.loads(self.request.body)
    self.validate_request(req_body, ())
    if key[0] == Project.PREFIX_PRIVATE:
      db.run_in_transaction(self.put_private, key, req_body)
    elif users.is_current_user_admin():
      db.run_in_transaction(self.put_public, key, req_body)
    else:
      raise HttpError(403)
    self.output_json({})

  def put_private(self, key, req_body):
    user_data = self.get_user_data()
    if 'n' in req_body:
      projects = user_data.get_projects()
      if key not in projects:
        raise HttpError(404)
      projects[key]['n'] = req_body['n'] or ''
      user_data.set_projects(projects)
      user_data.put()
    if ('j' in req_body) or ('h' in req_body):
      project = Project.get_by_project_id_safe(key, user_data.id_or_name())
      project.load_from_dict(req_body, False)
      project.put()

  def put_public(self, key, req_body):
    user = users.get_current_user()
    if not user:
      raise HttpError(403)
    user_id = user.user_id()
    project = Project.get_by_project_id_safe(key, user_id)
    project.load_from_dict(req_body, True)
    project.put()

  def delete(self):
    key = self.get_project_id()
    if key[0] == Project.PREFIX_PRIVATE:
      db.run_in_transaction(self.delete_private, key)
    elif users.is_current_user_admin():
      db.run_in_transaction(self.delete_public, key)
    else:
      raise HttpError(403)
    self.output_json({})

  def delete_private(self, key):
    user_data = self.get_user_data()
    projects  = user_data.get_projects()
    if key not in projects:
      raise HttpError(404)
    del projects[key]
    user_data.set_projects(projects)
    user_data.put()
    Project.delete_by_project_id(key, user_data.id_or_name())

  def delete_public(self, key):
    user = users.get_current_user()
    if not user:
      raise HttpError(403)
    Project.delete_by_project_id(key, user.user_id())

  def output_json(self, data):
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('while(1);' + json.dumps(data))


class PublishHandler(BaseHandler):
  def post(self):
    self.process()

  def put(self):
    self.process()

  def process(self):
    if not users.is_current_user_admin():
      raise HttpError(403)
    req_body = json.loads(self.request.body)
    self.validate_request(req_body, ('n', 'j', 'h'))
    project = Project(name     = (req_body['n'] or ''),
                      jscode   = (req_body['j'] or ''),
                      htmlcode = (req_body['h'] or ''))
    project.put()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('while(1);{}')


class JsHandler(BaseHandler):
  def post(self):
    self.process()

  def put(self):
    self.process()

  def process(self):
    req_body = json.loads(self.request.body)
    self.validate_request(req_body, ('requires',))
    builder = ClosureBuilder()
    builder.build(req_body['requires'])
    data = {
      'code':   builder.get_code(),
      'errors': builder.get_errors() }
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write('while(1);' + json.dumps(data))


class AdminHandler(BaseHandler):
  def get(self):
    if not users.is_current_user_admin():
      raise HttpError(404)
    command = self.request.get('cmd', '')
    if command == 'flush':
      memcache.flush_all();
    else:
      raise HttpError(404)
    self.response.headers['Content-Type'] = 'text/plain';
    self.response.out.write('ok');

isDevServer = os.environ['SERVER_SOFTWARE'].startswith('Development')
if isDevServer:
  logging.info('Debug mode enabled.')
else:
  logging.info('Debug mode disabled.')

application = webapp.WSGIApplication([
    ('/projects',        ProjectsHandler),
    ('/publish',         PublishHandler),
    ('/js',              JsHandler),
    ('/admin',           AdminHandler),
    ('(?:/(?:index)?)?', TopPageHandler)], isDevServer)

def main():
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
