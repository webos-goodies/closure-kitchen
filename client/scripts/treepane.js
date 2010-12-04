goog.provide('closurekitchen.TreePane');
goog.require('goog.string');
goog.require('goog.array');
goog.require('goog.math.Size');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.tree.TreeControl');
goog.require('goog.ui.tree.TreeNode');
goog.require('goog.ui.PopupMenu');
goog.require('goog.ui.MenuSeparator');
goog.require('goog.debug.Logger');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.ComponentBuilder');
goog.require('closurekitchen.Project');

goog.scope(function() {
var ActionID = closurekitchen.ActionID;
var Project  = closurekitchen.Project;

/**
 * A component that contains a tree view.
 * @constructor
 * @extends {goog.ui.Component}
 * @param {goog.dom.domHelper=} opt_domHelper A goog.dom.DomHelper instance.
 */
closurekitchen.TreePane = function(opt_domHelper) {
  goog.base(this, opt_domHelper);

  this.treeKH_    = new goog.events.KeyHandler();
  this.appStatus_ = {};

  var config = goog.object.clone(goog.ui.tree.TreeControl.defaultConfig);
  config.cleardotPath = 'files/images/cleardot.gif';
  this.treeControl_ = new goog.ui.tree.TreeControl('/', config, opt_domHelper);
  this.treeControl_.setShowRootLines(false);
  this.treeControl_.setShowRootNode(false);
  this.addChild(this.treeControl_);

  var projects = [];
  Project.forEachEntity(function(project) {
	projects[projects.length] = project;
  }, this);
  projects.sort(function(a, b){ return goog.string.numerateCompare(a.getName(), b.getName()) });
  goog.array.forEach(projects, function(project) {
	if(project.isPrivate())
	  this.addPrivateProject_(project);
	else
	  this.addPublicProject_(project);
  }, this);

  var builder = new closurekitchen.ComponentBuilder(opt_domHelper);
  this.contextMenu_ = new goog.ui.PopupMenu(opt_domHelper);
  this.contextMenu_.addChild(builder.buildMenuItem(ActionID.OPEN_PROJECT),    true);
  this.contextMenu_.addChild(builder.buildMenuItem(ActionID.RENAME_PROJECT),  true);
  this.contextMenu_.addChild(new goog.ui.MenuSeparator(opt_domHelper),        true);
  this.contextMenu_.addChild(builder.buildMenuItem(ActionID.DELETE_PROJECT),  true);
};
goog.inherits(closurekitchen.TreePane, goog.ui.Component);

/**
 * CSS class name of the root element.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.TreePane.CLASS_NAME_ = goog.getCssName('treepane');

/**
 * CSS class name of the tree view.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.TreePane.TREE_CLASS_NAME_ =
  goog.getCssName(closurekitchen.TreePane.CLASS_NAME_, 'tree');

/**
 * CSS class name of the book link.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.TreePane.BOOK_CLASS_NAME_ =
  goog.getCssName(closurekitchen.TreePane.CLASS_NAME_, 'book');

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.TreePane.logger_ = goog.debug.Logger.getLogger('closurekitchen.TreePane');

/**
 * The TreeControl instance.
 * @type {goog.ui.tree.TreeControl}
 * @private
 */
closurekitchen.TreePane.prototype.treeControl_;

/**
 * The parent element of the tree view.
 * @type {Element}
 * @private
 */
closurekitchen.TreePane.prototype.treeEl_;

/**
 * The element for ad.
 * @type {Element}
 * @private
 */
closurekitchen.TreePane.prototype.bookEl_;

/**
 * Context menu.
 * @type {goog.ui.PopupMenu}
 * @private
 */
closurekitchen.TreePane.prototype.contextMenu_;

/**
 * A folder node contains private projects.
 * @type {goog.ui.tree.TreeNode}
 * @private
 */
closurekitchen.TreePane.prototype.privateFolder_;

/**
 * A folder node contains public projects.
 * @type {goog.ui.tree.TreeNode}
 * @private
 */
closurekitchen.TreePane.prototype.publicFolder_;

/**
 * A KeyHandler for the tree view.
 * @type {goog.events.KeyHandler}
 * @private
 */
closurekitchen.TreePane.prototype.treeKH_;

/**
 * Application status cache.
 * @type {Object}
 * @private
 */
closurekitchen.TreePane.prototype.appStatus_;

/**
 * Returns the node related with specified project.
 * @param {string} project The project instance.
 * @return {goog.ui.tree.TreeNode} The node related with the project.
 * @private
 */
closurekitchen.TreePane.prototype.findByProject_ = function(project) {
  if(!project.isNew()) {
	var projectId = project.getId();
	if(this.privateFolder_) {
	  var children = this.privateFolder_.getChildren();
	  for(var i = 0, l = children.length ; i < l ; ++i) {
		if(children[i].getModel() == projectId)
		  return children[i];
	  }
	}
	if(this.publicFolder_) {
	  var children = this.publicFolder_.getChildren();
	  for(var i = 0, l = children.length ; i < l ; ++i) {
		if(children[i].getModel() == projectId)
		  return children[i];
	  }
	}
  }
  return null;
};

/**
 * Adds the project in the private projects folder.
 * @param {closurekitchen.Project} project The project instance.
 * @private
 */
closurekitchen.TreePane.prototype.addPrivateProject_ = function(project) {
  goog.asserts.assert(!project.isNew(),
					  'An unsaved project cannot be added to the tree view.');

  if(!this.privateFolder_) {
	this.privateFolder_ = new goog.ui.tree.TreeNode(
	  goog.getMsg('Private projects'),
	  this.treeControl_.getConfig(),
	  this.getDomHelper());
	this.privateFolder_.expand();
	this.treeControl_.add(this.privateFolder_);
  }

  var node = new goog.ui.tree.TreeNode(
	goog.string.htmlEscape(project.getName() || ''),
	this.treeControl_.getConfig(),
	this.getDomHelper());
  node.setModel(project.getId());
  this.privateFolder_.add(node);
};

/**
 * Adds the project in the public projects folder.
 * @param {closurekitchen.Project} project The project instance.
 * @private
 */
closurekitchen.TreePane.prototype.addPublicProject_ = function(project) {
  goog.asserts.assert(!project.isNew(),
					  'An unsaved project cannot be added to the tree view.');

  if(!this.publicFolder_) {
	this.publicFolder_ = new goog.ui.tree.TreeNode(
	  goog.getMsg('Sample projects'),
	  this.treeControl_.getConfig(),
	  this.getDomHelper());
	this.publicFolder_.expand();
	this.treeControl_.add(this.publicFolder_);
  }

  var node = new goog.ui.tree.TreeNode(
	goog.string.htmlEscape(project.getName()),
	this.treeControl_.getConfig(),
	this.getDomHelper());
  node.setModel(project.getId());
  this.publicFolder_.add(node);
};

/**
 * Returns the selected project id.
 * @return {?string} the selected project.
 * @private
 */
closurekitchen.TreePane.prototype.getSelectedProjectId = function() {
  var node = this.treeControl_.getSelectedItem();
  return node && node.getModel();
};

/**
 * Dispatches specified action event.
 * @param {closurekitchen.ActionID} action Action ID.
 * @return {boolean} True if the event is dispatched, false otherwise.
 * @private
 */
closurekitchen.TreePane.prototype.dispatchActionEvent_ = function(actionId) {
  var projectId = this.getSelectedProjectId();
  if(projectId) {
	closurekitchen.ActionEvent.dispatch(this, actionId, projectId);
	closurekitchen.TreePane.logger_.info(
	  'Issue ' + actionId + ' action for project id:' + projectId);
	return true;
  }
  return false;
}

/**
 * Applies the modifications of the project.
 * @param {closurekitchen.Project} project The project to apply.
 */
closurekitchen.TreePane.prototype.applyProject = function(project) {
  var node = this.findByProject_(project);
  if(node) {
	node.setText(project.getName());
  } else if(project.isPrivate()) {
	this.addPrivateProject_(project);
  } else {
	this.addPublicProject_(project);
  }
};

/**
 * Delete the project.
 * @param {closurekitchen.Project} project The project to delete.
 */
closurekitchen.TreePane.prototype.deleteProject = function(project) {
  var node = this.findByProject_(project), parent = null;
  if(node) {
	while(node.getChildCount() == 0 && (parent = node.getParent())) {
	  parent.removeChild(node);
	  node = parent;
	}
  }
};

/**
 * This method is called by the SplitPane when the browser window is resized.
 * @param {goog.math.Size} size The size of the pane.
 */
closurekitchen.TreePane.prototype.resize = function(size) {
  size         = new goog.math.Size(size.width - 2, size.height - 2);
  size.height -= goog.style.getBorderBoxSize(this.bookEl_).height;
  goog.style.setSize(this.treeEl_, size);
};

/**
 * Returns a status bundle.
 * @return {closurekitchen.StatusBundle} Status bundle.
 * @private
 */
closurekitchen.TreePane.prototype.createStatusBundle_ = function() {
  var projectId = this.getSelectedProjectId();
  var project   = projectId && Project.findById(projectId);
  this.appStatus_.isNew      = false;
  this.appStatus_.isModified = false;
  this.appStatus_.exist      = !!project;
  if(project) {
	this.appStatus_.isPriv = project.isPrivate();
  }
  return new closurekitchen.StatusBundle(this.appStatus_);
};

/**
 * An event handler for double click events on the tree view.
 * @param {goog.events.Event} e The event object.
 */
closurekitchen.TreePane.prototype.onDblClickTreeView_ = function(e) {
  this.dispatchActionEvent_(ActionID.OPEN_PROJECT);
};

/**
 * An event handler for key events on the tree view.
 * @param {goog.events.KeyEvent} e The event object.
 */
closurekitchen.TreePane.prototype.onKeyTreeView_ = function(e) {
  if(e.keyCode == goog.events.KeyCodes.ENTER &&
	 this.dispatchActionEvent_(ActionID.OPEN_PROJECT))
  {
    e.preventDefault();
  }
}

/**
 * An event handler called before show the context menu.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.TreePane.prototype.onBeforeShowMenu_ = function(e) {
  bundle = this.createStatusBundle_();
  if(this.contextMenu_)
	this.contextMenu_.updateByStatusBundle(bundle);
};

/**
 * An event handler for ACTION event from the context menu.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.TreePane.prototype.onMenuAction_ = function(e) {
  var model    = e.target.getModel();
  var actionId = model && model.actionId;
  if(actionId) {
	this.dispatchActionEvent_(actionId);
  }
};

/** @inheritDoc */
closurekitchen.TreePane.prototype.createDom = function() {
  this.treeControl_.createDom();
  var dom      = this.getDomHelper();
  var treeRoot = this.treeControl_.getElement();
  this.treeEl_ = dom.createDom('div', closurekitchen.TreePane.TREE_CLASS_NAME_, treeRoot);
  this.bookEl_ = dom.createDom(
	'div', closurekitchen.TreePane.BOOK_CLASS_NAME_,
	dom.createDom(
	  'a', {'target': '_blank', 'href': 'http://www.amazon.co.jp/gp/product/4844329626/' }));
  this.setElementInternal(dom.createDom(
	'div', closurekitchen.TreePane.CLASS_NAME_, this.treeEl_, this.bookEl_));
  this.contextMenu_.render();
}

/** @inheritDoc */
closurekitchen.TreePane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var treeEl = this.treeControl_.getElement();
  this.treeKH_.attach(treeEl)
  this.contextMenu_.attach(treeEl.parentNode, undefined, undefined, true);
  this.getHandler().
    listen(treeEl,            goog.events.EventType.DBLCLICK,       this.onDblClickTreeView_).
    listen(this.contextMenu_, goog.ui.Component.EventType.ACTION,   this.onMenuAction_).
    listen(this.contextMenu_, goog.ui.Menu.EventType.BEFORE_SHOW,   this.onBeforeShowMenu_).
    listen(this.treeKH_,      goog.events.KeyHandler.EventType.KEY, this.onKeyTreeView_);
};

/** @inheritDoc */
closurekitchen.TreePane.prototype.exitDocument = function() {
  this.treeKH_.detach();
  this.contextMenu_.detachAll();
  goog.base(this, 'exitDocument');
};

/** @inheritDoc */
closurekitchen.TreePane.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.contextMenu_ && this.contextMenu_.dispose();
  this.contextMenu_ = null;
  this.treeEl_      = null;
  this.bookEl_      = null;
};

/** @inheritDoc */
closurekitchen.TreePane.prototype.updateByStatusBundle = function(bundle) {
  this.appStatus_ = bundle.getAppStatus();
  goog.base(this, 'updateByStatusBundle', this.createStatusBundle_());
};

});
