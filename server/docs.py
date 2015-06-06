# coding=UTF-8

import os
import re
import sys
import logging

from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

logging.getLogger().setLevel(logging.DEBUG)

isDevServer = os.environ['SERVER_SOFTWARE'].startswith('Development')
if isDevServer:
  logging.info('Debug mode enabled.')
else:
  logging.info('Debug mode disabled.')

class DocsHandler(webapp.RequestHandler):
  BASE_URL  = r'http://google.github.io/closure-library/api/'
  REFLG     = re.M | re.I | re.S
  URLATR_RE = re.compile(r'\s*(href|src)="([^\">]+)"', REFLG)
  URLATR    = r' \1="%s\2"' % BASE_URL
  SCRIPT_RE = re.compile(r'<script[\s>].*?</script>', REFLG)
  HEADER_RE = re.compile(r'<header>.*?</header>', REFLG)
  NAV_RE    = re.compile(r'<nav>.*?</nav>', REFLG)
  A_RE      = re.compile(r'<a[^>]*?href="(?:source/)[^>]*>')
  EXTERN_RE = re.compile(r'<a[^>]*?href="https?:[^>]*>')
  EXTRA     = """
<style>
  article { padding-top:0; margin-top:0; width:auto !important; }
</style>
</body>"""

  def get(self, fname):
    content = self.cache_file(fname)
    if content:
      self.response.out.write(content)
      if fname.endswith('.html'):
        self.response.headers['Content-Type'] = 'text/html'
      elif fname.endswith('.js'):
        self.response.headers['Content-Type'] = 'text/javascript'
      elif fname.endswith('.css'):
        self.response.headers['Content-Type'] = 'text/css'
      else:
        self.response.headers['Content-Type'] = 'text/plain'
    else:
      self.error(404)
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.out.write('File Not Found')

  def cache_file(self, fname):
    data = memcache.get(key='docs2_' + fname)
    if data is not None:
      return data
    else:
      data = self.fetch_file(fname)
      if data is not None:
        memcache.add(key='docs2_' + fname, value=data, time=60*60)
        return data
      else:
        return None

  def fetch_file(self, fname):
    url = self.BASE_URL + fname
    logging.info('fetching %s...' % url)
    response = urlfetch.fetch(url)
    if response.status_code == 200:
      html = response.content
      if fname.endswith('.html'):
        html = self.SCRIPT_RE.sub('', html)
        html = self.HEADER_RE.sub('', html)
        html = self.NAV_RE.sub('', html)
        html = self.A_RE.sub(self.modify_anchor, html)
        html = self.EXTERN_RE.sub(self.external_link, html)
        html = html + self.EXTRA
      return html
    else:
      logging.info('Failed to fetch %s.' % url)
      return None

  def expand_url(self, matchobj):
    return re.sub(self.URLATR_RE, self.URLATR, matchobj.group(0))

  def modify_anchor(self, matchobj):
    return '<a target="_blank"' + self.expand_url(matchobj)[2:]

  def external_link(self,matchobj):
    return '<a target="_blank"' + matchobj.group(0)[2:]

application = webapp.WSGIApplication([
    ('/docs/([^/]+)', DocsHandler,)], isDevServer)

def main():
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
