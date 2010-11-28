goog.provide('closurekitchen.App');
goog.require('goog.string');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.forms');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.style');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.events.EventHandler');
goog.require('goog.net.cookies');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.Dialog');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Console');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.StatusBundle');
goog.require('closurekitchen.User');
goog.require('closurekitchen.Project');
goog.require('closurekitchen.ThreePane');
goog.require('closurekitchen.EditorPane');
goog.require('closurekitchen.TreePane');
goog.require('closurekitchen.ConsolePane');
goog.require('closurekitchen.RenameDialog');

goog.scope(function() {
var ActionID = closurekitchen.ActionID;
var Project  = closurekitchen.Project;
var User     = closurekitchen.User;

/**
 * An application class.
 * @constructor
 */
closurekitchen.App = function() {
  var startupInfo = window['startupInfo'];
  var pageUri     = goog.Uri.parse(window.location);

  this.isModified_   = false;
  this.updating_     = false;
  this.jsCache_      = [];
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.user_         = new User(pageUri.getParameterValue('user') || startupInfo['userType']);
  this.viewportSize_ = new goog.dom.ViewportSizeMonitor();
  this.splitDelay_   = new goog.async.Delay(this.onSplitDelayFired_, 1000, this);

  Project.initialize(startupInfo['projects'], startupInfo['samples']);

  if(startupInfo['projectId'] && this.user_.isUser())
	this.currentProject_ = Project.findById(startupInfo['projectId']);
  if(!this.currentProject_) {
	var values = {};
	try{
	  if(window.localStorage) {
		values['j'] = localStorage.getItem(closurekitchen.App.StorageKey.JS);
		values['h'] = localStorage.getItem(closurekitchen.App.StorageKey.HTML);
	  }
	} catch(e) {
	  closurekitchen.App.logger_.severe('Failed to fetch the locally saved project.', e);
	}
	this.currentProject_ = new Project(Project.Type.PRIVATE, values);
	goog.net.cookies.remove(closurekitchen.App.COOKIE_PROJECT_ID);
  }

  this.treePane_    = new closurekitchen.TreePane();
  this.editorPane_  = new closurekitchen.EditorPane(this.currentProject_);
  this.consolePane_ = new closurekitchen.ConsolePane(pageUri);

  var splitPos = { hpos: 0, vpos: 0 };
  try{
	if(window.localStorage) {
	  splitPos.hpos =
		goog.string.toNumber(localStorage.getItem(closurekitchen.App.StorageKey.HPOS) || '');
	  splitPos.vpos =
		goog.string.toNumber(localStorage.getItem(closurekitchen.App.StorageKey.VPOS) || '');
	}
  } catch(e) {
	closurekitchen.App.logger_.severe('Failed to fetch the locally saved settings.', e);
  }
  this.rootComponent_ = new closurekitchen.ThreePane(
	this.treePane_, this.editorPane_, this.consolePane_, this.computeRootSize_(), splitPos);
  this.rootComponent_.render(goog.dom.getElement('main'));

  this.projNameDialog_ = new closurekitchen.RenameDialog();

  this.updateComponents_();

  goog.array.forEach(
	[[closurekitchen.ActionEvent.EVENT_TYPE, this.onAction_],
	 [goog.ui.Component.EventType.ACTION,    this.onAction_],
	 [goog.ui.Component.EventType.CHANGE,    this.onChangeSplit_]],
	function(item) {
	  this.eventHandler_.listen(this.rootComponent_, item[0], item[1]);
	}, this);

  this.shortcuts_ = new goog.ui.KeyboardShortcutHandler(window);
  this.shortcuts_.setAlwaysPreventDefault(true);
  this.shortcuts_.setAlwaysStopPropagation(true);
  this.shortcuts_.setAllShortcutsAreGlobal(true);
  this.shortcuts_.registerShortcut(ActionID.SAVE_CURRENT_PROJECT, 'ctrl+s');
  this.eventHandler_.listen(
	this.shortcuts_, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, this.onAction_);

  this.eventHandler_.listen(
	this.viewportSize_, goog.events.EventType.RESIZE, this.onResizeViewport_);
  this.onResizeViewport_();
  this.rootComponent_.finishInitialization();

  window.onbeforeunload = goog.bind(this.onUnload_, this);

  var indicator  = goog.dom.getElement('xhr-indicator');
  var xhrManager = closurekitchen.Project.getXhrManager();
  this.fadeInIndicator_  = new goog.fx.dom.FadeInAndShow(indicator, 10);
  this.fadeOutIndicator_ = new goog.fx.dom.FadeOutAndHide(indicator, 1000);
  this.eventHandler_.
    listen(xhrManager, goog.net.EventType.READY,    this.onXhrReady_).
    listen(xhrManager, goog.net.EventType.COMPLETE, this.onXhrComplete_);

  if(!this.user_.isUser()) {
	var dialog = new goog.ui.Dialog();
	dialog.setTitle(goog.getMsg('ご利用上の注意'));
	dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK);
	goog.dom.appendChild(dialog.getContentElement(), goog.dom.getElement('caution-dialog'));
	dialog.setVisible(true);
  }
};
goog.addSingletonGetter(closurekitchen.App);

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.App.logger_ = goog.debug.Logger.getLogger('closurekitchen.App');

/**
 * The cookie name for the current project id.
 * @type {string}
 * @const
 */
closurekitchen.App.COOKIE_PROJECT_ID = 'ck_pid';

/**
 * The keys of localStorage.
 * @enum {string}
 * @const
 */
closurekitchen.App.StorageKey = {
  JS:   'closure_kitchen_js',
  HTML: 'closure_kitchen_html',
  HPOS: 'closure_kitchen_hpos',
  VPOS: 'closure_kitchen_vpos'
};

/**
 * This flag is set while updating status.
 * @type {boolean}
 * @private
 */
closurekitchen.App.prototype.updating_;

/**
 * This flag is set if the current project is modified.
 * @type {boolean}
 * @private
 */
closurekitchen.App.prototype.isModified_;

/**
 * EventHandler instance that hold all event handlers in App class.
 * @type {goog.events.EventHandler}
 * @private
 */
closurekitchen.App.prototype.eventHandler_;

/**
 * Editting project.
 * @type {!closurekitchen.Project}
 * @private
 */
closurekitchen.App.prototype.currentProject_;

/**
 * Cache for compiled javascript code.
 * @type {Array.<{src:string, compiled:string}>}
 * @private
 */
closurekitchen.App.prototype.jsCache_;

/**
 * The root component of the UI component tree.
 * @type {closurekitchen.ThreePane}
 * @private
 */
closurekitchen.App.prototype.rootComponent_;

/**
 * An instance of EditorPane.
 * @type {closurekitchen.EditorPane}
 * @private
 */
closurekitchen.App.prototype.editorPane_;

/**
 * An instance of TreePane.
 * @type {closurekitchen.TreePane}
 * @private
 */
closurekitchen.App.prototype.treePane_;

/**
 * An instance of ConsolePane.
 * @type {closurekitchen.ConsolePane}
 * @private
 */
closurekitchen.App.prototype.consolePane_;

/**
 * ViewportSizeMonitor instance to fit the UI to the browser window.
 * @type {goog.dom.ViewportSizeMonitor}
 * @private
 */
closurekitchen.App.prototype.viewportSize_;

/**
 * The prompt dialog to set the project name.
 * @type {closurekitchen.RenameDialog}
 * @private
 */
closurekitchen.App.prototype.projNameDialog_;

/**
 * Handler for keyboard shortcuts.
 * @type {goog.ui.KeyboardShortcutHandler}
 * @private
 */
closurekitchen.App.prototype.shortcuts_;

/**
 * Fade in animation of the network access indicator.
 * @type {goog.fx.dom.FadeInAndShow}
 * @private
 */
closurekitchen.App.prototype.fadeInIndicator_;

/**
 * Fade out animation of the network access indicator.
 * @type {goog.fx.dom.FadeOutAndHide}
 * @private
 */
closurekitchen.App.prototype.fadeOutIndicator_;

/**
 * Save the project information into the local storage.
 * @param {closurekitchen.Project} project Project to store.
 * @private
 */
closurekitchen.App.prototype.saveProjectLocally_ = function(project) {
  try {
	if(project.getId()) {
	  goog.net.cookies.set(closurekitchen.App.COOKIE_PROJECT_ID, project.getId(), 60*60*24*365);
	  closurekitchen.App.logger_.info(
		'Set cookie ' + closurekitchen.App.COOKIE_PROJECT_ID + ' to ' + project.getId() + '.');
	} else {
	  goog.net.cookies.remove(closurekitchen.App.COOKIE_PROJECT_ID);
	  closurekitchen.App.logger_.info(
		'Remove cookie ' + closurekitchen.App.COOKIE_PROJECT_ID + '.');
	}
	if(window.localStorage) {
	  localStorage.setItem(closurekitchen.App.StorageKey.JS,   project.getJsCode());
	  localStorage.setItem(closurekitchen.App.StorageKey.HTML, project.getHtmlCode());
	}
  } catch(e) {
	closurekitchen.App.logger_.severe('Failed to save the project locally.', e);
  }
};

/**
 * Update ui components.
 * @private
 */
closurekitchen.App.prototype.updateComponents_ = function() {
  if(!this.updating_) {
	try {
	  this.updating_ = true;
	  var bundle = new closurekitchen.StatusBundle({
		isUser:     this.user_.isUser(),
		isAdmin:    this.user_.isAdmin(),
		isPriv:     this.currentProject_.isPrivate(),
		isModified: this.isModified_,
		exist:      true
	  });
	  this.rootComponent_.updateByStatusBundle(bundle);
	} finally {
	  this.updating_ = false;
	}
  } else {
	closurekitchen.App.logger_.warning('updateComponent_ is called recursively.');
  }
};

/**
 * Open the project.
 * @param {closurekitchen.Project} project Project to open.
 * @private
 */
closurekitchen.App.prototype.openProject_ = function(project) {
  if(this.currentProject_ && this.currentProject_.isNew()) {
	this.currentProject_.del();
	this.currentProject_ = null;
  }
  this.currentProject_ = project;
  project.fetch(this.openProjectCompleted_, this);
};

/**
 * This function is called when the cotent of the project has been fetched.
 * @param {closurekitchen.Project} project The project.
 * @private
 */
closurekitchen.App.prototype.openProjectCompleted_ = function(project) {
  if(this.currentProject_.getId() == project.getId()) {
	this.editorPane_.importFromProject(project);
	this.saveProjectLocally_(this.currentProject_);
  }
};

/**
 * Confirm to the close current project.
 * @return {boolean} Ok to close the current project.
 * @private
 */
closurekitchen.App.prototype.confirmToClose_ = function() {
  return (!this.isModified_ ||
		  confirm(goog.getMsg('The curent project is modified.\nDiscard anyway?')));
};

/**
 * Calculate the size of the root component.
 * @return {goog.math.Size} the size of the root component
 * @private
 */
closurekitchen.App.prototype.computeRootSize_ = function() {
  var size      = this.viewportSize_.getSize();
  var titleSize = goog.style.getBorderBoxSize(goog.dom.getElement('title'));
  return new goog.math.Size(size.width - 4 * 2, size.height - 4*2 - titleSize.height);
};

/**
 * Event handler that triggered when the browser window is resized.
 * @private
 */
closurekitchen.App.prototype.onResizeViewport_ = function() {
  this.rootComponent_.setSize(this.computeRootSize_());
};

/**
 * Event handler for CHANGE event from SplitPane.
 * @return {goog.events.Event} e Event object.
 * @private
 */
closurekitchen.App.prototype.onChangeSplit_ = function(e) {
  if(e.target instanceof goog.ui.SplitPane) {
	this.splitDelay_.start();
  }
};

/**
 * Saves the split positions to the local storage.
 * @private
 */
closurekitchen.App.prototype.onSplitDelayFired_ = function() {
  if(window.localStorage) {
	var pos = this.rootComponent_.exportSettings();
	localStorage.setItem(closurekitchen.App.StorageKey.HPOS, pos.hpos);
	localStorage.setItem(closurekitchen.App.StorageKey.VPOS, pos.vpos);
	closurekitchen.App.logger_.info(
	  goog.string.subs('Save the split positions : hpos=%s, vpos=%s', pos.hpos, pos.vpos));
  }
};

/**
 * Event handler for unload event.
 * @private
 */
closurekitchen.App.prototype.onUnload_ = function(e) {
  console.log('unload');
  e = e || window.event;
  if(this.isModified_) {
	var msg       = goog.getMsg('The curent project is modified.\nDiscard anyway?');
	e.returnValue = msg;
	return msg
  }
};

/**
 * Event handler for READY of any ajax request.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closurekitchen.App.prototype.onXhrReady_ = function(e) {
  var xhrManager = closurekitchen.Project.getXhrManager();
  if(xhrManager.getOutstandingCount() == 1) {
    this.fadeOutIndicator_.stop(false);
    this.fadeInIndicator_.play(true);
  }
};

/**
 * Event handler for COMPLETE of any ajax request.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closurekitchen.App.prototype.onXhrComplete_ = function(e) {
  var xhrManager = closurekitchen.Project.getXhrManager();
  if(xhrManager.getOutstandingCount() == 1) {
    this.fadeInIndicator_.stop(false);
    this.fadeOutIndicator_.play(true);
  }
};

/**
 * The event handler for all control actions.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.App.prototype.onAction_ = function(e) {
  var actionId, data = null;
  if(e instanceof closurekitchen.ActionEvent) {
	actionId = e.actionId;
	data     = e.data;
  } else if(e instanceof goog.ui.KeyboardShortcutEvent) {
	actionId = e.identifier;
  } else {
	var model = e.target.getModel();
	if(model) {
	  actionId = model.actionId;
	  data     = model.actionData;
	}
  }
  if(!actionId)
	return;

  if(this.updating_) {
	closurekitchen.App.logger_.warning(
	  goog.string.stubs('%s action is invoked with %s in updating.', actionId, data));
  } else {
	closurekitchen.App.logger_.info(
	  goog.string.subs('%s action is invoked with %s', actionId, data));
  }

  if(actionId == ActionID.CURRENT_PROJECT_CHANGED) {
	this.isModified_ = true;
  } else if(actionId == ActionID.NEW_PROJECT) {
	if(this.confirmToClose_()) {
	  this.openProject_(new Project(Project.Type.PRIVATE));
	}
  } else if(actionId == ActionID.OPEN_PROJECT) {
	if(this.confirmToClose_()) {
	  this.actionOpenProject(data);
	}
  } else if(actionId == ActionID.RENAME_PROJECT) {
	this.actionRenameProject_(data);
  } else if(actionId == ActionID.DELETE_PROJECT) {
	if(this.confirmToClose_()) {
	  this.actionDeleteProject_(data);
	}
  } else if(actionId == ActionID.SAVE_CURRENT_PROJECT) {
	this.actionSaveCurrentProject_();
  } else if(actionId == ActionID.RENAME_CURRENT_PROJECT) {
	this.actionRenameCurrentProject_();
  } else if(actionId == ActionID.PUBLISH_CURRENT_PROJECT) {
	this.actionPublishCurrentProject();
  } else if(actionId == ActionID.UPDATE_PREVIEW) {
	this.actionUpdatePreview_();
  } else if(actionId == ActionID.CLEAR_CONSOLE) {
	this.consolePane_.clear();
  } else {
	this.editorPane_.doAction(actionId, data);
  }

  if(!this.updating_)
	this.updateComponents_();
};

/**
 * Processes OPEN_PROJECT action.
 * @param {string} projectId Project ID to open.
 * @private
 */
closurekitchen.App.prototype.actionOpenProject = function(projectId) {
  goog.asserts.assert(projectId, 'Invoked OPEN_PROJECT action without project id.');
  var project = Project.findById(projectId);
  goog.asserts.assert(project, 'Invoked OPEN_PROJECT action with an invalid id(%s).', projectId);
  this.openProject_(project);
  this.isModified_ = false;
};

/**
 * Processes RENAME_PROJECT action.
 * @param {string} projectId Project ID to rename.
 * @private
 */
closurekitchen.App.prototype.actionRenameProject_ = function(projectId) {
  var project = projectId && Project.findById(projectId);
  goog.asserts.assert(project, 'Invoked RENAME_PROJECT action with an invalid id(%s).', projectId);
  if(this.user_.isUser()) {
	if(!this.user_.isAdmin() && !project.isPrivate()) {
		return;
	}
	this.projNameDialog_.openDialog(project, project.getName(), this.onProjNameEntered_, this);
  } else {
	closurekitchen.App.logger_.severe('Invoked RENAME_PROJECT command by guest.');
  }
};

/**
 * This function is called when the new project name is entered.
 * @param {closurekitchen.Project} project The project to be renamed.
 * @param {string} text The user entered text.
 * @private
 */
closurekitchen.App.prototype.onProjNameEntered_ = function(project, text) {
  project.setName(text);
  project.put(Project.Format.RENAME, this.onRenameProjectCompleted_, this);
};

/**
 * This function is called when the project name has changed.
 * @param {closurekitchen.Project} project The project.
 * @private
 */
closurekitchen.App.prototype.onRenameProjectCompleted_ = function(project) {
  this.treePane_.applyProject(project);
  if(this.currentProject_.getId() == project.getId()) {
	this.editorPane_.setProjectName(project.getName());
	// Saves the project id into cookie.
	this.saveProjectLocally_(this.currentProject_);
  }
};

/**
 * Processes DELETE_PROJECT action.
 * @param {string} projectId Project ID to delete.
 * @private
 */
closurekitchen.App.prototype.actionDeleteProject_ = function(projectId) {
  if(this.currentProject_.getId() == projectId) {
	this.openProject_(new Project(Project.Type.PRIVATE));
  }
  var project = projectId && Project.findById(projectId);
  goog.asserts.assert(project, 'DELETE_PROJECT action invoked without a project id.');
  project.del();
  this.treePane_.deleteProject(project);
};

/**
 * Processes SAVE_CURRENT_PROJECT action.
 * @private
 */
closurekitchen.App.prototype.actionSaveCurrentProject_ = function() {
  if(this.user_.isUser()) {
	if(!this.user_.isAdmin() && !this.currentProject_.isPrivate()) {
	  this.openProject_(this.currentProject_.duplicateAsPrivate());
	}
	this.editorPane_.exportToProject(this.currentProject_);
	this.saveProjectLocally_(this.currentProject_);
	if(this.currentProject_.isNew()) {
	  this.projNameDialog_.openDialog(
		this.currentProject_,
		this.editorPane_.getDisplayProjectName(),
		this.onProjNameEntered_, this);
	} else {
	  this.currentProject_.put(Project.Format.ALL);
	  this.isModified_ = false;
	}
  } else {
	closurekitchen.App.logger_.severe('Invoked SAVE_CURRENT_PROJECT command by guest.');
  }
};

/**
 * Processes RENAME_CURRENT_PROJECT action.
 * @private
 */
closurekitchen.App.prototype.actionRenameCurrentProject_ = function() {
  if(!this.currentProject_.isFetched())
	return;
  if(this.user_.isUser()) {
	if(!this.user_.isAdmin() && !this.currentProject_.isPrivate()) {
	  this.openProject_(this.currentProject_.duplicateAsPrivate());
	}
	this.editorPane_.exportToProject(this.currentProject_);
	this.saveProjectLocally_(this.currentProject_);
	this.projNameDialog_.openDialog(
	  this.currentProject_,
	  this.editorPane_.getDisplayProjectName(),
	  this.onProjNameEntered_, this);
  } else {
	closurekitchen.App.logger_.severe('Invoked RENAME_CURRENT_PROJECT command by guest.');
  }
};

/**
 * Processes PUBLISH_CURRENT_PROJECT action.
 * @private
 */
closurekitchen.App.prototype.actionPublishCurrentProject = function() {
  if(this.user_.isAdmin()) {
	this.editorPane_.exportToProject(this.currentProject_);
	this.saveProjectLocally_(this.currentProject_);
	this.currentProject_.put(Project.Format.PUBLISH);
  } else {
	closurekitchen.App.logger_.severe(
	  'Invoked PUBLISH_CURRENT_PROJECT command without admin privilege.');
  }
};

/**
 * Processes UPDATE_PREVIEW action.
 * @private
 */
closurekitchen.App.prototype.actionUpdatePreview_ = function() {
  this.editorPane_.exportToProject(this.currentProject_);
  this.saveProjectLocally_(this.currentProject_);
  var jsSrc  = this.currentProject_.getJsCode();
  var jsCode = this.getCompiledCode_(jsSrc);
  if(jsCode) {
	closurekitchen.App.logger_.info('Skip the compile request since the js code is cached.');
	this.updatePreview_(jsCode, jsSrc, this.currentProject_.getHtmlCode());
  } else {
	this.currentProject_.put(
	  Project.Format.COMPILE, goog.partial(this.onUpdatePreviewCompleted_, jsSrc), this);
  }
};

/**
 * This function is called when the project name has changed.
 * @param {string} jsSrc The source javascript code.
 * @param {closurekitchen.Project} project The project.
 * @param {closurekitchen.Project.Request} request The request information.
 * @param {goog.net.XhrIo} xhr A XhrIo instance.
 * @private
 */
closurekitchen.App.prototype.onUpdatePreviewCompleted_ = function(jsSrc, project, request, xhr) {
  var body = xhr.getResponseJson();
  if(goog.isArray(body['warnings'])) {
	goog.array.forEach(body['warnings'], function(record) {
	  var msg = goog.string.subs('line %s : %s', record['lineno']||0, record['warning']||'');
	  this.consolePane_.addLog(goog.debug.Logger.Level.WARNING, msg, 'warning');
	}, this);
  }
  if(goog.isArray(body['errors'])) {
	goog.array.forEach(body['errors'], function(record) {
	  var msg = goog.string.subs('line %s : %s', record['lineno']||0, record['error']||'');
	  this.consolePane_.addLog(goog.debug.Logger.Level.SEVERE, msg, 'error');
	}, this);
  }
  this.updatePreview_(goog.isString(body['compiledCode']) ? body['compiledCode'] : '',
					  jsSrc, project.getHtmlCode());
};

/**
 * Returns the compiled javascript code from cache.
 * @param {string} jsSrc The javascript code to be compiled.
 * @return {string|null} The compiled javascript code. If jsSrc is not cached then null.
 * @private
 */
closurekitchen.App.prototype.getCompiledCode_ = function(jsSrc) {
  jsSrc = goog.string.canonicalizeNewlines(goog.string.trim(jsSrc));
  var record = goog.array.find(this.jsCache_, function(cache) {
	return cache.src == jsSrc;
  }, this);
  return record && record.compiled;
};

/**
 * Update preview.
 * @param {string} jsCode Compiled javascript code.
 * @param {string} jsSrc The source of the javascript code.
 * @param {string} htmlCode HTML code.
 * @private
 */
closurekitchen.App.prototype.updatePreview_ = function(jsCode, jsSrc, htmlCode) {
  jsSrc = goog.string.canonicalizeNewlines(goog.string.trim(jsSrc));
  var index = goog.array.findIndex(this.jsCache_, function(cache) {
	return cache.src == jsSrc;
  }, this);
  if(index >= 0) {
	closurekitchen.App.logger_.info('Update the existing compile cache.');
	goog.array.removeAt(this.jsCache_, index);
  } else if(this.jsCache_.length >= 10) {
	closurekitchen.App.logger_.info('Remove the expired compile cache.');
	this.jsCache_.shift();
  }
  this.jsCache_.push({ src: jsSrc, compiled: jsCode});
  jsCode   = jsCode.replace(/<\/(script)/i, '<\\\\/\1');
  htmlCode = htmlCode.replace(/\{\{\s*script\s*\}\}/i, function() { return jsCode; });
  this.editorPane_.updatePreview(htmlCode);
};

goog.debug.Console.autoInstall();
goog.debug.Console.instance.getFormatter().showExceptionText = true;
closurekitchen.App.getInstance();

});
