goog.provide('closurekitchen.Project');
goog.provide('closurekitchen.Project.Request');
goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.Uri');
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrManager');
goog.require('goog.debug.Logger');
goog.require('closurekitchen.i18n');

/**
 * A model class for a project.
 * @param {closurekitchen.Project.Type} type The type of project.
 * @param {Object=} values The initial value of each field.
 * @constructor
 * @extends {goog.Disposable}
 */
closurekitchen.Project = function(type, values) {
  goog.asserts.assert(
	type == closurekitchen.Project.Type.PRIVATE || type == closurekitchen.Project.Type.PUBLIC,
	'Project type must be one of the closurekitchen.Project.Type member.');
  this.type_ = type;

  values = values || {};
  goog.isString(values['id']) && (this.id_       = values['id']);
  goog.isString(values['n'])  && (this.name_     = values['n']);
  goog.isString(values['j'])  && (this.jscode_   = values['j']);
  goog.isString(values['h'])  && (this.htmlcode_ = values['h']);
};
goog.inherits(closurekitchen.Project, goog.Disposable);

/**
 * Project type.
 * @enum {string}
 */
closurekitchen.Project.Type = {
  PRIVATE: 'private',
  PUBLIC:  'public'
};

/**
 * Serialization format.
 * @enum {string}
 */
closurekitchen.Project.Format = {
  ALL:      'ALL',
  RENAME:   'RENAME',
  PUBLISH:  'PUBLISH',
  COMPILE:  'COMPILE',
  REQUIRES: 'REQUIRES'
};

/**
 * Use server or not.
 * @type {boolean}
 * @const
 * @private
 */
closurekitchen.Project.LOCAL_MODE = location.protocol == 'file:'

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.Project.logger_ = goog.debug.Logger.getLogger('closurekitchen.Project');

/**
 * Entities.
 * @type {Object.<string, closurekitchen.Project>}
 * @private
 */
closurekitchen.Project.entities_ = {};

/**
 * XhrManager instance to handle all ajax requests (except preview requests).
 * @type {goog.net.XhrManager}
 * @private
 */
closurekitchen.Project.xhrManager_ = new goog.net.XhrManager();

/**
 * An id for ajax requests.
 * @type {number}
 * @private
 */
closurekitchen.Project.nextXhrId_ = 1;

/**
 * Request object map.
 * @type {Object.<number, closurekitchen.Project.Request>}
 * @private
 */
closurekitchen.Project.requests_ = {};

/**
 * Returns an XhrManager.
 * @return {goog.net.XhrManager} An XhrManager.
 */
closurekitchen.Project.getXhrManager = function() {
  return closurekitchen.Project.xhrManager_;
};

/**
 * Outputs the response to the logger.
 * @param {goog.net.XhrIo} xhr A XhrIo instance.
 * @private
 */
closurekitchen.Project.logResponse_ = function(xhr) {
  var isSuccess = xhr.isSuccess();
  var log = ['Network access is ', isSuccess ? 'succeeded.' : 'failed.'];
  log.push('\nuri: ', xhr.getLastUri(), '\nstatus: ', xhr.getStatus(), ' ', xhr.getStatusText());
  if(!xhr.isSuccess()) {
	log.push('\nlastError: ', xhr.getLastError());
  }
  log.push('\nbody:\n', xhr.getResponseText());
  closurekitchen.Project.logger_.log(
	isSuccess ? goog.debug.Logger.Level.INFO : goog.debug.Logger.Level.WARNING,
	log.join(''));
};

/**
 * Calls the callback function.
 * @param {Function} callback Function to call.
 * @param {Object} scope The this object of callback.
 * @param {Array=} args The arguments passed to callback.
 * @return {*} The return value of callback.
 * @private
 */
closurekitchen.Project.invokeCallback_ = function(callback, scope, args) {
  if(callback) {
	goog.asserts.assertFunction(
	  callback, 'callback must be a function but %s', goog.typeOf(callback));
	args = args || [];
	goog.asserts.assertArray(
	  args, 'args must be an array but %s', goog.typeOf(args));
	return callback.apply(scope || goog.global, args || []);
  } else {
	return null;
  }
};

/**
 * Initializes entities.
 * @param {Object.<string, closurekitchen.Project>} privateProjs Private projects.
 * @param {Object.<string, closurekitchen.Project>} publicProjs Public projects.
 */
closurekitchen.Project.initialize = function(privateProjs, publicProjs) {
  var data = [
	[publicProjs,  closurekitchen.Project.Type.PUBLIC],
	[privateProjs, closurekitchen.Project.Type.PRIVATE]];

  goog.array.forEach(data, function(entry) {
	var projs = entry[0], type = entry[1];
	goog.object.forEach(projs, function(value, key) {
	  if(key) {
		goog.asserts.assert(!closurekitchen.Project.entities_[key],
							'There are 2 or more projects with the same key.');
		value['id'] = key;
		closurekitchen.Project.entities_[key] = new closurekitchen.Project(type, value);
	  }
	});
  });
};

/**
 * Iterates all entities.
 * @param {Function} f The function called for each entity.
 * @param {Object=} opt_scope The scope object of f.
 */
closurekitchen.Project.forEachEntity = function(f, opt_scope) {
  goog.object.forEach(closurekitchen.Project.entities_, f, opt_scope);
}

/**
 * Find a entity with specified id.
 * @param {string} id The entity id.
 * @returns {?closurekitchen.Project} The entity with id. If not found, null.
 */
closurekitchen.Project.findById = function(id) {
  return (id && closurekitchen.Project.entities_[id]) || null;
};

/**
 * The type of the project.
 * @type {closurekitchen.Project.Type}
 * @private
 */
closurekitchen.Project.prototype.type_;

/**
 * Whether the project is deleted or not.
 * @type {boolean}
 * @private
 */
closurekitchen.Project.prototype.isDeleted_ = false;

/**
 * The id of the project.
 * @type {?string}
 * @private
 */
closurekitchen.Project.prototype.id_ = null;

/**
 * The name of the project.
 * @type {?string}
 * @private
 */
closurekitchen.Project.prototype.name_ = null;

/**
 * JavaScript code.
 * @type {?string}
 * @private
 */
closurekitchen.Project.prototype.jscode_ = null;

/**
 * HTML code.
 * @type {?string}
 * @private
 */
closurekitchen.Project.prototype.htmlcode_ = null;

/**
 * Returns where the project is private or not.
 * @return {boolean} True if this project is private, false otherwise.
 */
closurekitchen.Project.prototype.isPrivate = function() {
  return this.type_ == closurekitchen.Project.Type.PRIVATE;
};

/**
 * Returns the id of the project.
 * @return {?string} The id.
 */
closurekitchen.Project.prototype.getId = function() {
  return this.id_;
};

/**
 * Returns the name of the project.
 * @return {?string} The name.
 */
closurekitchen.Project.prototype.getName = function() {
  return this.name_;
};

/**
 * Returns the JavaScript code.
 * @return {?string} The JavaScript code.
 */
closurekitchen.Project.prototype.getJsCode = function() {
  return this.jscode_ || '';
};

/**
 * Returns the HTML code.
 * @return {?string} The HTML code.
 */
closurekitchen.Project.prototype.getHtmlCode = function() {
  return this.htmlcode_ || '';
};

/**
 * Sets the name of the project.
 * @param {string} name The new project name.
 */
closurekitchen.Project.prototype.setName = function(name) {
  this.name_ = name || '';
};

/**
 * Sets the JavaScript code.
 * @param {string} jscode The new JavaScript code
 */
closurekitchen.Project.prototype.setJsCode = function(jscode) {
  this.jscode_ = jscode || '';
};

/**
 * Sets the HTML code.
 * @param {string} htmlcode The new HTML code
 */
closurekitchen.Project.prototype.setHtmlCode = function(htmlcode) {
  this.htmlcode_ = htmlcode || '';
};

/**
 * Returns whether this project has been saved.
 * @returns {boolean} If false, this project has been saved. Otherwise true.
 */
closurekitchen.Project.prototype.isNew = function() {
  return !goog.isDefAndNotNull(this.id_);
};

/**
 * Returns whether this project has been fetched.
 * @returns {boolean} If true, this project has been fetched. Otherwise false.
 */
closurekitchen.Project.prototype.isFetched = function() {
  return this.isNew() || (goog.isString(this.jscode_) && goog.isString(this.htmlcode_));
};

/**
 * Duplicate this project as a private project.
 * @return Duplicated project.
 */
closurekitchen.Project.prototype.duplicateAsPrivate = function() {
  return new closurekitchen.Project(
	closurekitchen.Project.Type.PRIVATE,
	{ 'n': this.name_, 'j': this.jscode_, 'h': this.htmlcode_ });
};

/**
 * Returns the mime-type of the serialized data.
 * @param {*} format The format parameter of serialize().
 * @return {string} The mime-type.
 */
closurekitchen.Project.prototype.getContentType = function(format) {
  if(format != closurekitchen.Project.Format.COMPILE)
	return 'application/json';
  else
	return 'text/javascript';
};

/**
 * Returns the url used in fetch() / put().
 * @param {*} format The format parameter of serialize().
 * @return {string} The url.
 */
closurekitchen.Project.prototype.getRequestUrl = function(format) {
  if(format == closurekitchen.Project.Format.REQUIRES)
	return '/js';
  else if(format == closurekitchen.Project.Format.COMPILE)
	return '/compile';
  else if(format == closurekitchen.Project.Format.PUBLISH)
	return '/publish';
  else if(this.isNew())
	return '/projects'
  else
	return '/projects?id=' + goog.string.urlEncode(this.id_);
};

/**
 * Serializes the contents of this model.
 * @param {*} format The format identifier.
 * @returns {string} The serialized data.
 */
closurekitchen.Project.prototype.serialize = function(format) {
  var obj = null;
  if(format == closurekitchen.Project.Format.ALL ||
	 format == closurekitchen.Project.Format.PUBLISH) {
	obj = { 'n': this.name_, 'j': this.jscode_, 'h': this.htmlcode_ };
  } else if(format == closurekitchen.Project.Format.COMPILE) {
	return goog.isString(this.jscode_) ? this.jscode_ : '';
  } else if(format == closurekitchen.Project.Format.REQUIRES) {
	var requires = [];
	(this.jscode_ || '').replace(
		/(?:^|;)\s*goog\s*\.\s*require\s*\([\'\"]([^\'\"]+)[\'\"]\)/mg,
	  function(m, n) { requires.push(n); return ''; });
	obj = { 'requires': requires };
  } else if(format == closurekitchen.Project.Format.RENAME) {
	if(this.isNew())
	  obj = { 'n': this.name_, 'j': this.jscode_, 'h': this.htmlcode_ };
	else
	  obj = { 'n': this.name_ };
  } else {
	goog.asserts.fail('Unknown serialization format.');
  }
  return goog.json.serialize(obj);
};

/**
 * Loads contents from the serialized data.
 * @param {string} data The serialized data.
 * @param {closurekitchen.Project.Format} opt_format Format of the request to obtain the data.
 */
closurekitchen.Project.prototype.load = function(data, opt_format) {
  if(opt_format == closurekitchen.Project.Format.REQUIRES ||
	 opt_format == closurekitchen.Project.Format.COMPILE)
	return;

  var xssPrefix = 'while(1);';
  if(data.indexOf(xssPrefix) == 0) {
	data = data.substring(xssPrefix.length);
  }
  var json = goog.json.parse(data);
  goog.isString(json['n']) && (this.name_     = json['n']);
  goog.isString(json['j']) && (this.jscode_   = json['j']);
  goog.isString(json['h']) && (this.htmlcode_ = json['h']);
  if(goog.isString(json['id']) && this.isNew()) {
	goog.asserts.assert(!closurekitchen.Project.entities_[json['id']],
						'Project ID must be unique.');
	this.id_ = json['id'];
	closurekitchen.Project.entities_[this.id_] = this;
  }
};

/**
 * Fetches the contents of the project from the remote server.
 * @param {Function=} opt_callback This function is called when the request is complete.
 * @param {Object=} opt_scope The scope of the callback.
 * @param {Function=} opt_error This function is called when the request is failed.
 */
closurekitchen.Project.prototype.fetch = function(opt_callback, opt_scope, opt_error) {
  if(this.isFetched() || closurekitchen.Project.LOCAL_MODE) {
	closurekitchen.Project.invokeCallback_(opt_callback, opt_scope, [this]);
	return;
  }

  var id = closurekitchen.Project.nextXhrId_++;
  goog.asserts.assert(!closurekitchen.Project.requests_[id], 'Request id is recycled.');

  var request = closurekitchen.Project.xhrManager_.send(
    id, this.getRequestUrl(closurekitchen.Project.Format.ALL),
	'GET', null, {}, 0, goog.bind(this.processResponse_, this, id));
  closurekitchen.Project.requests_[id] = new closurekitchen.Project.Request(
	request, closurekitchen.Project.Format.ALL, opt_callback, opt_error, opt_scope);

  this.jscode_   = '';
  this.htmlcode_ = '';
};

/**
 * Stores the project to the the remote server.
 * @param {*} format The format identifier.
 * @param {Function=} opt_callback This function is called when the request is complete.
 * @param {Object=} opt_scope The scope of the callback.
 */
closurekitchen.Project.prototype.put = function(format, opt_callback, opt_scope) {
  var id = closurekitchen.Project.nextXhrId_++;
  goog.asserts.assert(!closurekitchen.Project.requests_[id], 'Request id is recycled.');

  if(!closurekitchen.Project.LOCAL_MODE) {
	var request = closurekitchen.Project.xhrManager_.send(
	  id, this.getRequestUrl(format), this.isNew() ? 'POST' : 'PUT',
	  this.serialize(format), { 'Content-Type': this.getContentType(format) },
	  0, goog.bind(this.processResponse_, this, id));

	closurekitchen.Project.requests_[id] =
	  new closurekitchen.Project.Request(request, format, opt_callback, null, opt_scope);
  } else {
	if(this.isNew() && format != closurekitchen.Project.Format.PUBLISH) {
	  this.load('{"id":"' + Math.random() + '"}', format);
	}
	closurekitchen.Project.invokeCallback_(opt_callback, opt_scope, [this]);
  }
};

/**
 * Deletes the project.
 * @param {Function=} opt_callback This function is called when the request is complete.
 * @param {Object=} opt_scope The scope of the callback.
 */
closurekitchen.Project.prototype.del = function(opt_callback, opt_scope) {
  if(this.isDeleted_) {
	return;
  }
  if(this.isNew() || closurekitchen.Project.LOCAL_MODE) {
	closurekitchen.Project.invokeCallback_(opt_callback, opt_scope, [this]);
	return;
  }

  var id = closurekitchen.Project.nextXhrId_++;
  goog.asserts.assert(!closurekitchen.Project.requests_[id], 'Request id is recycled.');

  var request = closurekitchen.Project.xhrManager_.send(
    id, this.getRequestUrl(closurekitchen.Project.Format.ALL),
	'DELETE', null, {}, 0, goog.bind(this.processResponse_, this, id));
  closurekitchen.Project.requests_[id] = new closurekitchen.Project.Request(
	request, closurekitchen.Project.Format.ALL, opt_callback, null, opt_scope);
  this.isDeleted_ = true;
};

/**
 * This function is called when the put/post request is completed.
 * @param {number} requestId The request id.
 * @param {goog.events.Event} e A event object generated by XhrIo.
 * @private
 */
closurekitchen.Project.prototype.processResponse_ = function(requestId, e) {
  var request = closurekitchen.Project.requests_[requestId];
  goog.asserts.assert(request, 'Request information is not exist.');
  goog.object.remove(closurekitchen.Project.requests_, requestId);

  try {
	var xhr = e.target;
	closurekitchen.Project.logResponse_(xhr);
	if(xhr.isSuccess()) {
	  var method = request.getRequest().getMethod();
	  if(method == 'GET' || method == 'POST') {
		this.load(xhr.getResponseText(), request.getFormat());
	  }
	  try {
		request.invokeCallback([this, request, xhr]);
	  } catch(e) {
		closurekitchen.Project.logger_.severe(
		  'The exception is raised in the callback.', e);
	  }
	  if(method == 'DELETE') {
		this.dispose();
	  }
	} else {
	  try {
		request.invokeErrorCallback([this, request, xhr]);
	  } catch(e) {
		closurekitchen.Project.logger_.severe(
		  'The exception is raised in the error callback.', e);
	  }
	  if(request.getRequest().getMethod() == 'GET') {
		this.jscode_   = null;
		this.htmlcode_ = null;
	  }
	}
  } finally {
	request.dispose();
  }
};

/**
 * Request information.
 * @param {goog.net.XhrManager.Request} request Request object.
 * @param {closurekitchen.Project.Format} format Request format of this request.
 * @param {?Function} callback Function called when this request is completed.
 * @param {?Function} error Function called when this request is failed.
 * @param {?Object}  opt_scope this object of callback.
 * @constructor
 * @extends {goog.Disposable}
 */
closurekitchen.Project.Request = function(request, format, callback, error, scope) {
  goog.base(this);
  this.request_       = request;
  this.format_        = format;
  this.callback_      = callback || goog.nullFunction;
  this.errorCallback_ = error    || goog.nullFunction;
  this.scope_         = scope    || null;
};
goog.inherits(closurekitchen.Project.Request, goog.Disposable);

/**
 * Request object.
 * @type {goog.net.XhrManager.Request}
 * @private
 */
closurekitchen.Project.Request.prototype.request_;

/**
 * Request format of this request.
 * @type {closurekitchen.Project.Format}
 * @private
 */
closurekitchen.Project.Request.prototype.format_;

/**
 * Function called when this request is completed.
 * @type {Function}
 * @private
 */
closurekitchen.Project.Request.prototype.callback_;

/**
 * Function called when this request is failed.
 * @type {Function}
 * @private
 */
closurekitchen.Project.Request.prototype.errorCallback_;

/**
 * this object of callback.
 * @type {Object}
 * @private
 */
closurekitchen.Project.Request.prototype.scope_;

/** @inheritDoc */
closurekitchen.Project.Request.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.request_       = null;
  this.format_        = null;
  this.callback_      = null;
  this.errorCallback_ = null;
  this.scope_         = null;
};

/**
 * Returns the request object.
 * @return {goog.net.XhrManager.Request}
 */
closurekitchen.Project.Request.prototype.getRequest = function() {
  return this.request_;
};

/**
 * Returns the request format of this request.
 * @return {closurekitchen.Project.Format}
 */
closurekitchen.Project.Request.prototype.getFormat = function() {
  return this.format_;
};

/**
 * invokes the callback function.
 * @param {Array=} args The arguments passed to callback.
 * @return {*} The return value of callback.
 */
closurekitchen.Project.Request.prototype.invokeCallback = function(args) {
  return closurekitchen.Project.invokeCallback_(this.callback_, this.scope_, args);
};

/**
 * invokes the error callback function.
 * @param {Array=} args The arguments passed to callback.
 * @return {*} The return value of callback.
 */
closurekitchen.Project.Request.prototype.invokeErrorCallback = function(args) {
  return closurekitchen.Project.invokeCallback_(this.errorCallback_, this.scope_, args);
};
