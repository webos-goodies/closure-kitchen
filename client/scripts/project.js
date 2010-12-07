goog.provide('closurekitchen.Project');
goog.provide('closurekitchen.Project.AbstractRequest');
goog.provide('closurekitchen.Project.Request');
goog.provide('closurekitchen.Project.LocalRequest');
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
 * Returns an XhrManager.
 * @return {goog.net.XhrManager} An XhrManager.
 */
closurekitchen.Project.getXhrManager = function() {
  return closurekitchen.Project.Request.getXhrManager();
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

/** @inheritDoc */
closurekitchen.Project.prototype.disposeInternal = function() {
  if(!this.isNew()) {
	closurekitchen.Project.logger_.info('Project ' + this.id_ + 'is removed from index.');
	goog.object.remove(closurekitchen.Project.entities_, this.id_);
  }
  this.type_      = null;
  this.isDeleted_ = true;
  this.id_        = null;
  this.name_      = null;
  this.jscode_    = null;
  this.htmlcode_  = null;
};

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
 * Makes this project unfetched.
 */
closurekitchen.Project.prototype.unfetch = function() {
  this.jscode_   = null;
  this.htmlcode_ = null;
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
  return 'application/json';
};

/**
 * Returns the url used in fetch() / put().
 * @param {*} format The format parameter of serialize().
 * @return {string} The url.
 */
closurekitchen.Project.prototype.getRequestUrl = function(format) {
  if(format == closurekitchen.Project.Format.REQUIRES)
	return '/js';
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
  } else if(format == closurekitchen.Project.Format.REQUIRES) {
	var requires = [];
	(this.jscode_ || '').replace(
		/(?:^|;)\s*goog\s*\.\s*require\s*\([\'\"]([^\'\"]+)[\'\"]\)/mg,
	  function(m, n) { requires.push(n); return ''; });
	requires.sort();
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
 * Returns an request object.
 * @param {string} method HTTP method.
 * @param {closurekitchen.Project.Format} format Request format of this request.
 * @param {Function} callback Function called when this request is completed.
 * @param {Function} error Function called when this request is failed.
 * @param {Object}  scope this object of callback.
 * @return {closurekitchen.Project.AbstractRequest} A new request object.
 * @protected
 */
closurekitchen.Project.prototype.createRequest = function(method, format, callback, error, scope) {
  var type = null;
  var body = null;
  method   = method.toUpperCase();
  if(method == 'POST' || method == 'PUT') {
	type = this.getContentType(format);
	body = this.serialize(format);
  }
  if(closurekitchen.Project.LOCAL_MODE) {
	return new closurekitchen.Project.LocalRequest(
	  this.getRequestUrl(format), method, body, type, format, callback, error, scope);
  } else {
	return new closurekitchen.Project.Request(
	  this.getRequestUrl(format), method, body, type, format, callback, error, scope);
  }
};

/**
 * Loads contents from the serialized data.
 * @param {string} data The serialized data.
 * @param {closurekitchen.Project.Format} opt_format Format of the request to obtain the data.
 */
closurekitchen.Project.prototype.load = function(data, opt_format) {
  if(opt_format == closurekitchen.Project.Format.REQUIRES)
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
  var request = this.createRequest(
	'GET', closurekitchen.Project.Format.ALL, opt_callback, opt_error, opt_scope);
  if(!this.isFetched()) {
	request.send(this);
  } else {
	request.emulateSuccess(this, '{}');
  }

  this.jscode_   = this.jscode_   || '';
  this.htmlcode_ = this.htmlcode_ || '';
};

/**
 * Stores the project to the the remote server.
 * @param {*} format The format identifier.
 * @param {Function=} opt_callback This function is called when the request is complete.
 * @param {Object=} opt_scope The scope of the callback.
 */
closurekitchen.Project.prototype.put = function(format, opt_callback, opt_scope) {
  var request = this.createRequest(
	this.isNew() ? 'POST' : 'PUT', format, opt_callback, null, opt_scope);
  request.send(this);
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
  this.isDeleted_ = true;

  var request = this.createRequest(
	'DELETE', closurekitchen.Project.Format.ALL, opt_callback, null, opt_scope);
  if(!this.isNew()) {
	request.send(this);
  } else {
	request.emulateSuccess(this);
  }
};

/**
 * Abstract base class of request information.
 * @param {string} uri Request uri.
 * @param {string} method HTTP method.
 * @param {?string} body Request body, if any.
 * @param {?string} bodyType The content type of the request body.
 * @param {closurekitchen.Project.Format} format Request format of this request.
 * @param {Function} callback Function called when this request is completed.
 * @param {Function} error Function called when this request is failed.
 * @param {Object} scope this object of callback.
 * @constructor
 * @extends {goog.Disposable}
 */
closurekitchen.Project.AbstractRequest = function(uri, method, body, bodyType,
												  format, callback, error, scope) {
  goog.base(this);
  this.project       = null;
  this.uri           = uri;
  this.method        = method.toUpperCase();
  this.body          = body;
  this.bodyType      = bodyType;
  this.format        = format;
  this.callback      = callback || goog.nullFunction;
  this.errorCallback = error    || goog.nullFunction;
  this.scope         = scope    || null;
};
goog.inherits(closurekitchen.Project.AbstractRequest, goog.Disposable);

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.Project.AbstractRequest.logger_ =
  goog.debug.Logger.getLogger('closurekitchen.Project.AbstractRequest');

/**
 * The related project.
 * @type {closurekitchen.Project}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.project;

/**
 * Request uri.
 * @type {string}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.uri;

/**
 * HTTP method.
 * @type {string}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.method;

/**
 * Request body.
 * @type {?string}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.body;

/**
 * The content type of the request body.
 * @type {?string}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.bodyType;

/**
 * Request format of this request.
 * @type {closurekitchen.Project.Format}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.format;

/**
 * Function called when this request is completed.
 * @type {Function}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.callback;

/**
 * Function called when this request is failed.
 * @type {Function}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.errorCallback;

/**
 * this object of callback.
 * @type {Object}
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.scope;

/** @inheritDoc */
closurekitchen.Project.AbstractRequest.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.project       = null;
  this.uri           = null;
  this.method        = null;
  this.body          = null;
  this.bodyType      = null;
  this.format        = null;
  this.callback      = null;
  this.errorCallback = null;
  this.scope         = null;
};

/**
 * Invokes the callback function.
 * @param {Function} callback The function to call.
 * @param {Array=} args The arguments passed to callback.
 * @return {*} The return value of callback.
 * @protected
 */
closurekitchen.Project.AbstractRequest.prototype.invokeCallback = function(callback, args) {
  if(callback) {
	goog.asserts.assertFunction(
	  callback, 'callback must be a function but %s', goog.typeOf(callback));
	args = args || [];
	goog.asserts.assertArray(args, 'args must be an array but %s', goog.typeOf(args));
	try {
	  return callback.apply(this.scope || goog.global, args);
	}catch(e){
	  closurekitchen.Project.AbstractRequest.logger_.severe(
		'An exception is thrown from the network request callback.', e);
	  return null;
	}
  } else {
	return null;
  }
};

/**
 * Send this request.
 * @param {closurekitchen.Project} project The related project.
 */
closurekitchen.Project.AbstractRequest.prototype.send = goog.abstractMethod;

/**
 * Emulate the request.
 * @param {closurekitchen.Project} project The related project.
 * @param {string=} opt_body The response body.
 * @return {*} The return value of callback.
 */
closurekitchen.Project.AbstractRequest.prototype.emulateSuccess = goog.abstractMethod;

/**
 * Request information.
 * @param {string} uri Request uri.
 * @param {string} method HTTP method.
 * @param {?string} body Request body, if any.
 * @param {?string} bodyType The content type of the request body.
 * @param {closurekitchen.Project.Format} format Request format of this request.
 * @param {Function} callback Function called when this request is completed.
 * @param {Function} error Function called when this request is failed.
 * @param {Object} scope this object of callback.
 * @constructor
 * @extends {closurekitchen.Project.AbstractRequest}
 */
closurekitchen.Project.Request = function(uri, method, body, bodyType,
										  format, callback, error, scope) {
  goog.base(this, uri, method, body, bodyType, format, callback, error, scope);
};
goog.inherits(closurekitchen.Project.Request, closurekitchen.Project.AbstractRequest);

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.Project.Request.logger_ =
  goog.debug.Logger.getLogger('closurekitchen.Project.Request');

/**
 * Cache for REQUIRES request.
 * @type {Object.<string, string>}
 * @private
 */
closurekitchen.Project.cache_ = {};

/**
 * XhrManager instance to handle all ajax requests (except preview requests).
 * @type {goog.net.XhrManager}
 * @private
 */
closurekitchen.Project.Request.xhrManager_ = new goog.net.XhrManager();

/**
 * An id for ajax requests.
 * @type {number}
 * @private
 */
closurekitchen.Project.Request.nextXhrId_ = 1;

/**
 * Returns the XhrManager used in all requests.
 * @return {goog.net.XhrManager} The XhrManager.
 */
closurekitchen.Project.Request.getXhrManager = function() {
  return closurekitchen.Project.Request.xhrManager_;
};

/**
 * Outputs the response to the logger.
 * @param {goog.net.XhrIo} xhr A XhrIo instance.
 * @private
 */
closurekitchen.Project.Request.logResponse_ = function(xhr) {
  var isSuccess = xhr.isSuccess();
  var log = ['Network access is ', isSuccess ? 'succeeded.' : 'failed.'];
  log.push('\nuri: ', xhr.getLastUri(), '\nstatus: ', xhr.getStatus(), ' ', xhr.getStatusText());
  if(!xhr.isSuccess()) {
	log.push('\nlastError: ', xhr.getLastError());
  }
  log.push('\nbody:\n', xhr.getResponseText());
  closurekitchen.Project.Request.logger_.log(
	isSuccess ? goog.debug.Logger.Level.INFO : goog.debug.Logger.Level.WARNING,
	log.join(''));
};

/**
 * Send this request.
 * @param {closurekitchen.Project} project The related project.
 */
closurekitchen.Project.Request.prototype.send = function(project) {
  goog.asserts.assert(!this.project, 'This request has already sent');
  this.project = project;

  if((this.method == 'POST' || this.method == 'PUT') &&
	 this.format == closurekitchen.Project.Format.REQUIRES) {
	var cache = closurekitchen.Project.cache_[this.body];
	if(cache) {
	  this.emulateSuccess(this.project, cache);
	  return;
	}
  }

  closurekitchen.Project.Request.xhrManager_.send(
	closurekitchen.Project.Request.nextXhrId_++,
	this.uri,
	this.method,
	this.body,
	goog.isString(this.bodyType) ? { 'Content-Type': this.bodyType } : {},
	0,
	goog.bind(this.processResponse_, this));
};

/**
 * Process the response.
 * @param {goog.events.Event} e An event object generated by XhrIo.
 * @private
 */
closurekitchen.Project.Request.prototype.processResponse_ = function(e) {
  try {
	var xhr = e.target;
	closurekitchen.Project.Request.logResponse_(xhr);
	if(xhr.isSuccess()) {
	  var body = xhr.getResponseText();
	  if((this.method == 'POST' || this.method == 'PUT') &&
		 this.format == closurekitchen.Project.Format.REQUIRES) {
		closurekitchen.Project.cache_[this.body] = body;
	  }
	  this.emulateSuccess(this.project, body);
	} else {
	  request.invokeErrorCallback(this.errorCallback, [this.project, xhr.getResponseText()]);
	  if(this.method == 'GET') {
		this.project.unfetch();
	  }
	}
  } finally {
	this.dispose();
  }
};

/**
 * Emulate the request.
 * @param {closurekitchen.Project} project The related project.
 * @param {string=} opt_body The response body.
 * @return {*} The return value of callback.
 */
closurekitchen.Project.Request.prototype.emulateSuccess = function(project, opt_body) {
  try {
	this.project = project;
	if(this.method == 'GET' || this.method == 'POST') {
	  this.project.load(opt_body, this.format);
	}
	this.invokeCallback(this.callback, [this.project, opt_body]);
	if(this.method == 'DELETE') {
	  this.project.dispose();
	}
  } finally {
	this.dispose();
  }
};

/**
 * Dummy request information for local mode.
 * @param {string} uri Request uri.
 * @param {string} method HTTP method.
 * @param {?string} body Request body, if any.
 * @param {?string} bodyType The content type of the request body.
 * @param {closurekitchen.Project.Format} format Request format of this request.
 * @param {Function} callback Function called when this request is completed.
 * @param {Function} error Function called when this request is failed.
 * @param {Object} scope this object of callback.
 * @constructor
 * @extends {closurekitchen.Project.AbstractRequest}
 */
closurekitchen.Project.LocalRequest = function(uri, method, body, bodyType,
											   format, callback, error, scope) {
  goog.base(this, uri, method, body, bodyType, format, callback, error, scope);
};
goog.inherits(closurekitchen.Project.LocalRequest, closurekitchen.Project.AbstractRequest);

/**
 * Send this request.
 * @param {closurekitchen.Project} project The related project.
 */
closurekitchen.Project.LocalRequest.prototype.send = function(project) {
  goog.asserts.assert(!this.project, 'This request has already sent');
  this.project = project;
  var response = '{}';
  if(this.method == 'POST' &&
	 this.format != closurekitchen.Project.Format.PUBLISH &&
	 this.format != closurekitchen.Project.Format.REQUIRES) {
	response = '{"id":"' + Math.random() + '"}';
  }
  goog.global.setTimeout(goog.bind(this.emulateSuccess, this, this.project, response), 0);
};

/**
 * Emulate the request.
 * @param {closurekitchen.Project} project The related project.
 * @param {string} opt_body The response body.
 * @return {*} The return value of callback.
 */
closurekitchen.Project.LocalRequest.prototype.emulateSuccess = function(project, opt_body) {
  this.project = project;
  if(this.method == 'GET' || this.method == 'POST') {
	this.project.load(opt_body, this.format);
  }
  this.invokeCallback(this.callback, [this.project, opt_body]);
  if(this.method == 'DELETE') {
	this.project.dispose();
  }
};
