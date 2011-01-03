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
  BASE_URL  = r'http://closure-library.googlecode.com/svn/docs/'
  REFLG     = re.M | re.I | re.S
  HTML_RE   = re.compile(r'\.html$')
  URLATR_RE = re.compile(r'\s*(href|src)="([^\">]+)"', REFLG)
  URLATR    = r' \1="%s\2"' % BASE_URL
  SCRIPT_RE = re.compile(r'<script[\s>].*?</script>', REFLG)
  HEADER_RE = re.compile(r'^<div id="header">.*?^</div>', REFLG)
  COL2_RE   = re.compile(r'<div class="col2">.*?<\!-- Column 2 end -->\s*</div>', REFLG)
  LINK_RE   = re.compile(r'<link[^>]*>', REFLG)
  IMG_RE    = re.compile(r'<img[^>]*>', REFLG)
  A_RE      = re.compile(r'<a[^>]*?href="(?:\.\./trunk/|[^\">]*.source.html)[^>]*>')
  EXTERN_RE = re.compile(r'<a[^>]*?href="http:[^>]*>')
  EXTRA_RE  = re.compile(r'</body>', REFLG)
  EXTRA     = """
<style>
.rightmenu .colleft { right:0; }
.rightmenu .col1 { left:0; width:100%; }
.goog-zippy-expanded, .goog-zippy-collapsed { outline:none; }
.goog-zippy-expanded img  {
  background-image: url('http://closure-library.googlecode.com/svn/docs/static/images/minus.png');
}
.goog-zippy-collapsed img {
  background-image: url('http://closure-library.googlecode.com/svn/docs/static/images/plus.png');
}
</style>
<script src="../files/closuredocs.js"></script></body>"""

  def get(self, fname):
    content = self.cache_file(fname)
    if content:
      self.response.out.write(content)
      self.response.headers['Content-Type'] = 'text/html'
    else:
      self.error(404)
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.out.write('File Not Found')

  def cache_file(self, fname):
    data = memcache.get(key='docs_' + fname)
    if data is not None:
      return data
    else:
      data = self.fetch_file(fname)
      if data is not None:
        memcache.add(key='docs_' + fname, value=data, time=60*60)
        return data
      else:
        return None

  def fetch_file(self, fname):
    url = self.BASE_URL + fname
    logging.info('fetching %s...' % url)
    response = urlfetch.fetch(url)
    if response.status_code == 200:
      html = response.content
      if re.search(self.HTML_RE, fname):
        html = re.sub(self.SCRIPT_RE, '', html)
        html = re.sub(self.HEADER_RE, '', html)
        html = re.sub(self.COL2_RE, '', html)
        html = re.sub(self.LINK_RE, self.expand_url, html)
        html = re.sub(self.IMG_RE, self.expand_url, html)
        html = re.sub(self.A_RE, self.modify_anchor, html)
        html = re.sub(self.EXTERN_RE, self.external_link, html)
        html = re.sub(self.EXTRA_RE, self.EXTRA, html)
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
