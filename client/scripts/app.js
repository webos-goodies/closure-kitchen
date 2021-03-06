goog.provide('closurekitchen.App');
goog.require('goog.string');
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.style');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.events.EventHandler');
goog.require('goog.net.cookies');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.Dialog');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Console');
goog.require('closurekitchen.i18n');
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

  // Initialize properties.
  this.isModified_   = false;
  this.updating_     = false;
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.user_         = new User(pageUri.getParameterValue('user') || startupInfo['userType']);
  this.viewportSize_ = new goog.dom.ViewportSizeMonitor();
  this.splitDelay_   = new goog.async.Delay(this.onSplitDelayFired_, 1000, this);

  // Initialize projects.
  Project.initialize(startupInfo['projects'], startupInfo['samples']);

  if(startupInfo['projectId'] && this.user_.isUser())
	this.currentProject_ = Project.findById(startupInfo['projectId']);
  if(!this.currentProject_) {
	var values = {
	  'j': closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.JS),
	  'h': closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.HTML)
	};
	this.currentProject_ = new Project(Project.Type.PRIVATE, values);
	goog.net.cookies.remove(closurekitchen.App.COOKIE_PROJECT_ID);
  }

  // Build the main UI.
  this.treePane_    = new closurekitchen.TreePane();
  this.editorPane_  = new closurekitchen.EditorPane(this.currentProject_);
  this.consolePane_ = new closurekitchen.ConsolePane(pageUri);

  var splitPos = {
	hpos: goog.string.toNumber(
	  closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.HPOS) || '0'),
	vpos: goog.string.toNumber(
	  closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.VPOS) || '0')
  };
  this.rootComponent_ = new closurekitchen.ThreePane(
	this.treePane_, this.editorPane_, this.consolePane_, this.computeRootSize_(), splitPos);
  this.rootComponent_.render(goog.dom.getElement('main'));

  this.projNameDialog_ = new closurekitchen.RenameDialog();

  this.updateComponents_();

  // Listen UI events.
  goog.array.forEach(
	[[closurekitchen.ActionEvent.EVENT_TYPE, this.onAction_],
	 [goog.ui.Component.EventType.ACTION,    this.onAction_],
	 [goog.ui.Component.EventType.CHANGE,    this.onChangeSplit_]],
	function(item) {
	  this.eventHandler_.listen(this.rootComponent_, item[0], item[1]);
	}, this);

  // Initialize keyboard shortcuts.
  this.shortcuts_ = new goog.ui.KeyboardShortcutHandler(window);
  this.shortcuts_.setAlwaysPreventDefault(true);
  this.shortcuts_.setAlwaysStopPropagation(true);
  this.shortcuts_.setAllShortcutsAreGlobal(true);
  this.shortcuts_.registerShortcut(ActionID.SAVE_CURRENT_PROJECT, 'ctrl+s');
  this.eventHandler_.listen(
	this.shortcuts_, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, this.onAction_);

  // Fit the main UI to the browser window.
  this.eventHandler_.listen(
	this.viewportSize_, goog.events.EventType.RESIZE, this.onResizeViewport_);
  this.onResizeViewport_();
  this.rootComponent_.finishInitialization();

  // Confirm to discard unsaved changes on exit.
  window.onbeforeunload = goog.bind(this.onUnload_, this);

  // Initialize the XHR indicator.
  var indicator  = goog.dom.getElement('xhr-indicator');
  var xhrManager = closurekitchen.Project.getXhrManager();
  this.fadeInIndicator_  = new goog.fx.dom.FadeInAndShow(indicator, 10);
  this.fadeOutIndicator_ = new goog.fx.dom.FadeOutAndHide(indicator, 1000);
  this.eventHandler_.
    listen(xhrManager, goog.net.EventType.READY,    this.onXhrReady_).
    listen(xhrManager, goog.net.EventType.COMPLETE, this.onXhrComplete_);

  // Load the index of API reference.
  this.loadReference_();

  // Show an attribution message and more.
  if(closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.TUTO) != 'false') {
	goog.dom.getElement('tutorial-show').checked = true;
	this.showTutorial_();
  }
  this.eventHandler_.listen(
	goog.dom.getElement('tutorial-btn'),
	goog.events.EventType.CLICK,
	this.onShowTutorial_);
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
  VPOS: 'closure_kitchen_vpos',
  TUTO: 'show_tutorial'
};

/**
 * Additional code to export log records to the console view from the user's code in the preview.
 * @type {string}
 * @private
 */
closurekitchen.App.AdditionalJsCode_ = [
  "(function() {",
  "  function logProxy(r) {",
  "    window.parent['closurekitchen']['ConsolePane']['addLogRecord']({",
  "      'level': r.getLevel(), 'msg': r.getMessage(), 'loggerName': r.getLoggerName(), 'time': r.getMillis(),'exception':r.getException(),'exceptionText':r.getExceptionText() });",
  "  }",
  "  goog.debug.LogManager.getRoot().addHandler(logProxy);",
  "  var eh = new goog.debug.ErrorHandler(function(e) {",
  "    goog.debug.LogManager.getRoot().severe('Exception in preview', e);",
  "  });",
  "  eh.protectWindowSetInterval();",
  "  eh.protectWindowSetTimeout();",
  "  if(goog.events && goog.isFunction(goog.events.protectBrowserEventEntryPoint)) {",
  "    goog.events.protectBrowserEventEntryPoint(eh);",
  "  }",
  "  if(goog.net && goog.net.XhrIo &&",
  "     goog.isFunction(goog.net.XhrIo.protectEntryPoints)) {",
  "    goog.net.XhrIo.protectEntryPoints(eh);",
  "  }",
  "})();"].join('\n');

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
 * A map between class / script name and its reference page.
 * @type {Object.<string, string>}
 * @private
 */
closurekitchen.App.prototype.referenceMap_ = {};

/**
 * A dialog to show about Closure Kitchen.
 * @type {goog.ui.Dialog}
 * @private
 */
closurekitchen.App.prototype.aboutDialog_;

/**
 * A dialog to show tutorial movie.
 * @type {goog.ui.Dialog}
 * @private
 */
closurekitchen.App.prototype.tutorialDialog_;

/**
 * Fetch a value of the specified key from HTML5 LocalStorage.
 * @param {string} key The string key.
 * @return {*} The value of the key.
 */
closurekitchen.App.fetchLocalStorage = function(key) {
  try {
	if(window.localStorage) {
	  return localStorage.getItem(key);
	} else {
	  closurekitchen.App.logger_.info('HTML5 LocalStorage is not available.');
	}
  } catch(e) {
	closurekitchen.App.logger_.severe('Failed to fetch ' + key + ' from HTML5 LocalStorage.', e);
  }
  return null;
};

/**
 * Store the value into HTML5 LocalStorage.
 * @param {string} key The string key.
 * @param {string} value The value to store.
 */
closurekitchen.App.storeLocalStorage = function(key, value) {
  try {
	if(window.localStorage) {
	  localStorage.setItem(key, value);
	  closurekitchen.App.logger_.info(
		'Store LocalStorage : ' + key + ' = ' + goog.string.truncate(value, 32));
	} else {
	  closurekitchen.App.logger_.info('HTML5 LocalStorage is not available.');
	}
  } catch(e) {
	closurekitchen.App.logger_.severe('Failed to store ' + key + ' into HTML5 LocalStorage.', e);
  }
};

/**
 * Save the project information into the local storage.
 * @param {closurekitchen.Project} project Project to store.
 * @private
 */
closurekitchen.App.prototype.saveProjectLocally_ = function(project) {
  if(project.getId()) {
	goog.net.cookies.set(closurekitchen.App.COOKIE_PROJECT_ID, project.getId(), 60*60*24*365);
	closurekitchen.App.logger_.info(
	  'Set cookie ' + closurekitchen.App.COOKIE_PROJECT_ID + ' to ' + project.getId() + '.');
  } else {
	goog.net.cookies.remove(closurekitchen.App.COOKIE_PROJECT_ID);
	closurekitchen.App.logger_.info(
	  'Remove cookie ' + closurekitchen.App.COOKIE_PROJECT_ID + '.');
  }
  closurekitchen.App.storeLocalStorage(closurekitchen.App.StorageKey.JS,   project.getJsCode());
  closurekitchen.App.storeLocalStorage(closurekitchen.App.StorageKey.HTML, project.getHtmlCode());
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
		isNew:      this.currentProject_.isNew(),
		isModified: this.isModified_,
		exist:      true,
		canFind:    false
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
  project.fetch(this.openProjectCompleted_, this, this.openProjectFailed_);
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
 * This function is called when the request of the project's content is failed.
 * @param {closurekitchen.Project} project The project.
 * @private
 */
closurekitchen.App.prototype.openProjectFailed_ = function(project) {
  if(this.currentProject_.getId() == project.getId()) {
	this.currentProject_ = new Project(Project.Type.PRIVATE);
	this.editorPane_.importFromProject(this.currentProject_);
	this.saveProjectLocally_(this.currentProject_);
	closurekitchen.ConsolePane.addLog(
	  goog.debug.Logger.Level.SEVERE,
	  closurekitchen.i18n.getMsg('Failed to load "{$name}"', { 'name': project.getName()||'' }),
      'error');
  }
};

/**
 * Confirm to the close current project.
 * @return {boolean} Ok to close the current project.
 * @private
 */
closurekitchen.App.prototype.confirmToClose_ = function() {
  return (!this.isModified_ ||
		  confirm(closurekitchen.i18n.getMsg('The curent project is modified.\nDiscard anyway?')));
};

/**
 * Calculate the size of the root component.
 * @return {goog.math.Size} the size of the root component
 * @private
 */
closurekitchen.App.prototype.computeRootSize_ = function() {
  var size      = this.viewportSize_.getSize();
  var titleSize = goog.style.getBorderBoxSize(goog.dom.getElement('title'));
  return new goog.math.Size(Math.max(size.width - 4 * 2, 1),
							Math.max(size.height - 4*2 - titleSize.height, 1));
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
  var pos = this.rootComponent_.exportSettings();
  closurekitchen.App.storeLocalStorage(closurekitchen.App.StorageKey.HPOS, pos.hpos);
  closurekitchen.App.storeLocalStorage(closurekitchen.App.StorageKey.VPOS, pos.vpos);
};

/**
 * Event handler for unload event.
 * @private
 */
closurekitchen.App.prototype.onUnload_ = function(e) {
  e = e || window.event;
  if(!this.user_.isUser()) {
	this.editorPane_.exportToProject(this.currentProject_);
	this.saveProjectLocally_(this.currentProject_);
  } else if(this.isModified_) {
	var msg       = closurekitchen.i18n.getMsg('The curent project is modified.\nDiscard anyway?');
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
	this.actionDeleteProject_(data);
  } else if(actionId == ActionID.SAVE_CURRENT_PROJECT) {
	this.actionSaveCurrentProject_();
  } else if(actionId == ActionID.CLONE_CURRENT_PROJECT) {
	if(this.confirmToClose_()) {
	  this.actionCloneCurrentProject_();
	}
  } else if(actionId == ActionID.RENAME_CURRENT_PROJECT) {
	this.actionRenameCurrentProject_();
  } else if(actionId == ActionID.PUBLISH_CURRENT_PROJECT) {
	if(confirm(closurekitchen.i18n.getMsg('Are you sure to publish this project?'))) {
	  this.actionPublishCurrentProject();
	}
  } else if(actionId == ActionID.UPDATE_PREVIEW) {
	this.actionUpdatePreview_();
  } else if(actionId == ActionID.CLEAR_CONSOLE) {
	this.consolePane_.clear();
  } else if(actionId == ActionID.SEARCH) {
	var match = /^doc:(.*)/.exec(data);
	if(match && this.referenceMap_[match[1]]) {
	  this.editorPane_.showReference(this.referenceMap_[match[1]]);
	} else {
	  this.editorPane_.findNext(data);
	}
  } else if(actionId == ActionID.FIND_NEXT) {
	this.editorPane_.findNext(data);
  } else if(actionId == ActionID.FIND_PREV) {
	this.editorPane_.findPrevious(data);
  } else if(actionId == ActionID.ABOUT) {
	this.showAbout_();
  } else if(actionId == ActionID.TAB_CHANGED) {
	// nothing to do here. just update components.
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
  var project = projectId && Project.findById(projectId);
  goog.asserts.assert(project, 'DELETE_PROJECT action invoked without a project id.');
  if(confirm(closurekitchen.i18n.getMsg('Are you sure to delete {$name}?', { 'name': project.getName() }))) {
	if(this.currentProject_.getId() == projectId) {
	  this.openProject_(new Project(Project.Type.PRIVATE));
	}
	project.del();
	this.treePane_.deleteProject(project);
  }
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
 * Processes CLONE_CURRENT_PROJECT action.
 * @private
 */
closurekitchen.App.prototype.actionCloneCurrentProject_ = function() {
  if(this.user_.isUser() && !this.currentProject_.isNew()) {
	var project = new Project(Project.Type.PRIVATE, {
	  'j': this.currentProject_.getJsCode(),
	  'h': this.currentProject_.getHtmlCode()
	});
	this.openProject_(project);
	this.isModified_ = true;
  } else {
	closurekitchen.App.logger_.severe(
	  'CLONE_CURRENT_PROJECT action is ignored due to illegal status.');
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
  this.currentProject_.put(Project.Format.REQUIRES, this.onUpdatePreviewCompleted_, this);
};

/**
 * This function is called when the project name has changed.
 * @param {closurekitchen.Project} project The project.
 * @param {string} response The response body.
 * @private
 */
closurekitchen.App.prototype.onUpdatePreviewCompleted_ = function(project, response) {
  var xssPrefix = 'while(1);';
  if(response.indexOf(xssPrefix) == 0) {
	response = response.substring(xssPrefix.length);
  }
  var body = goog.json.parse(response);
  goog.array.forEach(body['errors'] || [], function(msg) {
	closurekitchen.ConsolePane.addLog(goog.debug.Logger.Level.SEVERE, msg, 'goog.require');
  }, this);
  this.updatePreview_(goog.isString(body['code']) ? body['code'] : '',
					  project.getJsCode(), project.getHtmlCode());
};

/**
 * Update preview.
 * @param {string} requires Required closure library modules.
 * @param {string} jsCode Compiled javascript code.
 * @param {string} htmlCode HTML code.
 * @private
 */
closurekitchen.App.prototype.updatePreview_ = function(requires, jsCode, htmlCode) {
  requires = requires + "\n" + closurekitchen.App.AdditionalJsCode_;
  var jsTags = [
	'<script type="text/javascript">',
	requires.replace(/<\/(script)/ig, '<\\\\/\1') + '</script>',
	'<script type="text/javascript">',
	jsCode.replace(/<\/(script)/ig, '<\\\\/\1') + '</script>'].join('');
  htmlCode = htmlCode.replace(/\{\{\s*script\s*\}\}/i, function() { return jsTags; });
  this.editorPane_.updatePreview(htmlCode, jsCode);
};

/**
 * Fetch the index of closure library's reference.
 * @private
 */
closurekitchen.App.prototype.loadReference_ = function() {
  closurekitchen.App.logger_.info('Load docs/types.js...');
  goog.net.XhrIo.send('docs/types.js', goog.bind(this.loadReferenceComplete_, this));
};

/**
 * This method is called when the index of closure library's reference is loaded.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.App.prototype.loadReferenceComplete_ = function(e) {
  if(e.target.isSuccess()) {
	closurekitchen.App.logger_.info('docs/types.js is loaded.');
	this.referenceMap_ = {};
	var body = e.target.getResponseText().replace(/^[^\{]*|\;\s*$/g, '');
    var json = JSON.parse(body);
    goog.array.forEach(json['types'], function(entry) {
      this.referenceMap_[entry['name']] = entry['href'];
    }, this);
	// this.parseReferenceIndex_(json['typeIndex'][2], '.', '');
	// this.parseReferenceIndex_(json['fileIndex'][2]['closure'][2], '/', '');
	this.editorPane_.setSearchCompletion(goog.object.getKeys(this.referenceMap_).sort());
	closurekitchen.App.logger_.info('Finished to set up auto-completion.');
  } else {
	closurekitchen.App.logger_.warning('Failed to load files/doc_json_index.js.');
  }
};

/**
 * Parse the array of entries of the closure library's reference.
 * @param {Array} data The array of entries.
 * @param {string} separator A separator of the entry names.
 * @param {string} path The path of the parent entry.
 * @private
*/
closurekitchen.App.prototype.parseReferenceIndex_ = function(data, separator, path) {
  goog.object.forEach(data, function(child, name) {
	if(child[0] != 'namespace' && child[1] && !/_(?:test\.js)?$/.test(name)) {
	  this.referenceMap_[path + name] = child[1];
	}
	if(child[2]) {
	  this.parseReferenceIndex_(child[2], separator, path + name + separator);
	}
  }, this);
};

/**
 * Show the about dialog.
 * @private
 */
closurekitchen.App.prototype.showAbout_ = function() {
  if(!this.aboutDialog_) {
	this.aboutDialog_ = new goog.ui.Dialog();
	this.aboutDialog_.setTitle(closurekitchen.i18n.getMsg('About Closure Kitchen'));
	this.aboutDialog_.setButtonSet(goog.ui.Dialog.ButtonSet.OK);
	goog.dom.appendChild(
	  this.aboutDialog_.getContentElement(), goog.dom.getElement('about'));
	this.aboutDialog_.setVisible(true);
  } else if(!this.aboutDialog_.isVisible()) {
	this.aboutDialog_.setVisible(true);
  }
};

/**
 * Show the tutorial dialog.
 * @private
 */
closurekitchen.App.prototype.showTutorial_ = function() {
  if(!this.tutorialDialog_) {
	this.tutorialDialog_ = new goog.ui.Dialog();
	this.tutorialDialog_.setTitle(closurekitchen.i18n.getMsg('Tutorial'));
	this.tutorialDialog_.setButtonSet(goog.ui.Dialog.ButtonSet.OK);
	this.eventHandler_.listen(
	  this.tutorialDialog_, goog.ui.Dialog.EventType.SELECT, this.onCloseTutorial_);
	goog.dom.appendChild(
	  this.tutorialDialog_.getContentElement(), goog.dom.getElement('tutorial'));
	this.tutorialDialog_.setVisible(true);
	var params = { 'allowScriptAccess': "always" };
	window['swfobject']['embedSWF']("http://www.youtube.com/v/ZRSLvbF6N4w?enablejsapi=1&version=3&playerapiid=tutorial", "tutorial-player", "640", "390", "8", null, null, params);
  } else if(!this.tutorialDialog_.isVisible()) {
	this.tutorialDialog_.setVisible(true);
  }
};

/**
 * This method is called when the tutorial link is clicked.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.App.prototype.onShowTutorial_ = function(e) {
  e.preventDefault();
  this.showTutorial_();
};

/**
 * This method is called when the tutorial dialog is closed.
 * @param {goog.ui.Dialog.Event} e The event object.
 * @private
 */
closurekitchen.App.prototype.onCloseTutorial_ = function(e) {
  var player = goog.dom.getElement('tutorial-player');
  if(player && goog.isFunction(player['stopVideo'])) {
	player['stopVideo']();
	closurekitchen.App.logger_.info('Stop the tutorial video.');
  }
  var oldShow =
	closurekitchen.App.fetchLocalStorage(closurekitchen.App.StorageKey.TUTO) != 'false';
  var newShow = goog.dom.getElement('tutorial-show').checked ? true : false;
  if(!newShow && oldShow != newShow) {
	alert(closurekitchen.i18n.getMsg(
	  'You can watch the tutorial anytime by clicking the "Tutorial" link above.'));
  }
  closurekitchen.App.storeLocalStorage(
	closurekitchen.App.StorageKey.TUTO, newShow ? 'true' : 'false');
};

/**
 * This function is called when the tutorial video is ready to playback.
 * @param {string} playerid The id of the player control.
 */
closurekitchen.App.onYouTubePlayerReady = function(playerid) {
  closurekitchen.App.logger_.info('The tutorial video is ready to playback.');
  var app = closurekitchen.App.getInstance();
  if(app.tutorialDialog_ && app.tutorialDialog_.isVisible()) {
	var player = goog.dom.getElement('tutorial-player');
	if(player && goog.isFunction(player['playVideo'])) {
	  player['playVideo']();
	  closurekitchen.App.logger_.info('Begin to playback the tutorial video.');
	}
  }
};
goog.exportSymbol('onYouTubePlayerReady', closurekitchen.App.onYouTubePlayerReady);


goog.debug.Console.autoInstall();
goog.debug.Console.instance.getFormatter().showExceptionText = true;
closurekitchen.App.getInstance();

});
