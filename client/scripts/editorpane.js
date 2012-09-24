goog.provide('closurekitchen.EditorPane');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('goog.ui.Tab');
goog.require('goog.ui.TabBar');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.User');
goog.require('closurekitchen.Project');
goog.require('closurekitchen.ComponentBuilder');
goog.require('closurekitchen.Toolbar');
goog.require('closurekitchen.JsEditorTab');
goog.require('closurekitchen.HtmlEditorTab');
goog.require('closurekitchen.PreviewTab');
goog.require('closurekitchen.ReferenceTab');

goog.scope(function() {
var TabBar         = goog.ui.TabBar;
var TabBarRenderer = goog.ui.TabBarRenderer;
var ActionID       = closurekitchen.ActionID;
var ActionEvent    = closurekitchen.ActionEvent;

/**
 * A component that contains JavaScript / HTML editors and a preview.
 * @param {closurekitchen.Project} project Project instance.
 * @param {closurekitchen.User} user The current user information.
 * @param {goog.dom.domHelper=} opt_domHelper A goog.dom.DomHelper instance.
 * @constructor
 * @extends {goog.ui.Component}
 */
closurekitchen.EditorPane = function(project, opt_domHelper) {
  goog.base(this, opt_domHelper);

  this.renamable_   = false;
  this.projectName_ = project.getName();

  this.toolbar_ = new closurekitchen.Toolbar(opt_domHelper);
  this.addChild(this.toolbar_);

  this.tabBar_ = new TabBar(TabBar.Location.TOP, TabBarRenderer.getInstance(), opt_domHelper);
  this.addChild(this.tabBar_);

  this.tabContents_ = [
	new closurekitchen.JsEditorTab(project.getJsCode(), opt_domHelper),
	new closurekitchen.HtmlEditorTab(project.getHtmlCode(), opt_domHelper),
	new closurekitchen.PreviewTab(opt_domHelper),
	new closurekitchen.ReferenceTab(opt_domHelper)];

  goog.array.forEach(this.tabContents_, function(content) {
	this.tabBar_.addChild(new goog.ui.Tab(content.getCaption(), null, opt_domHelper));
	this.addChild(content);
  }, this);
};
goog.inherits(closurekitchen.EditorPane, goog.ui.Component);

/**
 * CSS class name of root element.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.EditorPane.CLASS_NAME_ = goog.getCssName('editorpane');

/**
 * CSS class name of the project name.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.EditorPane.PROJNAME_CLASS_NAME_ =
  goog.getCssName(closurekitchen.EditorPane.CLASS_NAME_, 'projname');

/**
 * CSS class name of the tabbar.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.EditorPane.TABBAR_CLASS_NAME_ =
  goog.getCssName(closurekitchen.EditorPane.CLASS_NAME_, 'tabbar');

/**
 * CSS class name of the tab content.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.EditorPane.TABCONTENT_CLASS_NAME_ =
  goog.getCssName(closurekitchen.EditorPane.CLASS_NAME_, 'tabcontent');

/**
 * Project name can be renamed or not.
 * @type {boolean}
 * @private
 */
closurekitchen.EditorPane.prototype.renamable_;

/**
 * The project name.
 * @type {string}
 * @private
 */
closurekitchen.EditorPane.prototype.projectName_;

/**
 * The project name element.
 * @type {Element}
 * @private
 */
closurekitchen.EditorPane.prototype.projNameEl_;

/**
 * The TabBar instance.
 * @type {goog.ui.TabBar}
 * @private
 */
closurekitchen.EditorPane.prototype.tabBar_;

/**
 * The Toolbar instance.
 * @type {goog.ui.Toolbar}
 * @private
 */
closurekitchen.EditorPane.prototype.toolbar_;

/**
 * The array of tab contents.
 * @type {Array.<closurekitchen.AbstractEditorTab>}
 * @private
 */
closurekitchen.EditorPane.prototype.tabContents_;

/**
 * Returns the project name to display.
 * @return {string} the project name.
 * @private
 */
closurekitchen.EditorPane.prototype.getDisplayProjectName = function() {
  return this.projectName_ || closurekitchen.i18n.getMsg('New project');
};

/**
 * Set the project name.
 * @param {string} name The project name.
 * @private
 */
closurekitchen.EditorPane.prototype.setProjectName = function(name) {
  this.projectName_ = name;
  goog.dom.setTextContent(this.projNameEl_, this.getDisplayProjectName());
};

/**
 * An event handler that is called when the project name is clicked.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.EditorPane.prototype.onClickProjName_ = function(e) {
  if(this.renamable_) {
	this.dispatchEvent(new ActionEvent(this, ActionID.RENAME_CURRENT_PROJECT));
  }
};

/**
 * An event handler that is called when a tab is selected.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.EditorPane.prototype.onSelectTab_ = function(e) {
  var index = this.tabBar_.getSelectedTabIndex();
  goog.array.forEach(this.tabContents_, function(content, i) {
	content.showContent(index == i);
  }, this);
  this.dispatchEvent(new ActionEvent(this, ActionID.TAB_CHANGED));
};

/**
 * Execute the action.
 * @param {closurekitchen.ActionID} actionId ID of the action to execute.
 * @param {*=} opt_data Optional argument of the action.
 */
closurekitchen.EditorPane.prototype.doAction = function(actionId, opt_data) {
  var index = this.tabBar_.getSelectedTabIndex();
  if(this.tabContents_[index]) {
	this.tabContents_[index].doAction(actionId, opt_data);
  }
};

/**
 * Set the auto-completion data to search field.
 * @param {Array.<string>} data the auto-completion data.
 */
closurekitchen.EditorPane.prototype.setSearchCompletion = function(data) {
  this.toolbar_.setSearchCompletion(data);
};

/**
 * Copy contents to the specified project.
 * @param {closurekitchen.Project} project The project copies data to.
 */
closurekitchen.EditorPane.prototype.exportToProject = function(project) {
  project.setJsCode(this.tabContents_[0].getCode());
  project.setHtmlCode(this.tabContents_[1].getCode());
};

/**
 * Copy contents from the specified project and begin to edit it.
 * @param {closurekitchen.Project} project The project copies data from.
 */
closurekitchen.EditorPane.prototype.importFromProject = function(project) {
  // We cannot use project.isNew() to check whether the project has a name
  // since a duplicated project (generated by SAVE_CURRENT_PROJECT) has a name
  // though it doesn't have an id.
  this.setProjectName(project.getName() || null);
  this.tabContents_[0].setCode(project.getJsCode());
  this.tabContents_[1].setCode(project.getHtmlCode());
};

/**
 * Update preview.
 * @param {string} html An html code to display.
 * @param {string} js A compiled javascript code.
 */
closurekitchen.EditorPane.prototype.updatePreview = function(html, js) {
  this.tabContents_[2].setContent(html);
  this.tabBar_.setSelectedTabIndex(2);
};

/**
 * Search api reference.
 * @param {string} searchText The search text.
 * @private
 */
closurekitchen.EditorPane.prototype.showReference = function(searchText) {
  this.tabContents_[3].setContent(searchText);
  this.tabBar_.setSelectedTabIndex(3);
};

/**
 * This method is called by the SplitPane when the browser window is resized.
 * @param {goog.math.Size} size The size of the pane.
 */
closurekitchen.EditorPane.prototype.resize = function(size) {
  var height = goog.array.reduce(
	[this.projNameEl_.parentNode,
	 this.toolbar_.getElement(),
	 this.tabBar_.getElement().parentNode],
	function(height, element) {
	  return height - (goog.style.getBorderBoxSize(element).height || 0);
	}, size.height - 2, this);
  var contentSize = new goog.math.Size(size.width - 2, Math.max(height, 0));
  goog.array.forEach(this.tabContents_, function(content) {
	content.resize(contentSize);
  }, this);
};

/**
 * Find text forward.
 * @param {string} text The search text.
 */
closurekitchen.EditorPane.prototype.findNext = function(text) {
  var index = this.tabBar_.getSelectedTabIndex();
  if(this.tabContents_[index]) {
	this.tabContents_[index].findNext(text);
  }
};

/**
 * Find text backword.
 * @param {string} text The search text.
 */
closurekitchen.EditorPane.prototype.findPrevious = function(text) {
  var index = this.tabBar_.getSelectedTabIndex();
  if(this.tabContents_[index]) {
	this.tabContents_[index].findPrevious(text);
  }
};

/**
 * Calls createDom() for all children.
 * @param {goog.ui.Component} component The parent component.
 * @param {Array.<goog.ui.Component>} opt_children The child components.
 * @private
 */
closurekitchen.EditorPane.prototype.createChildDom_ = function(component) {
  var dom       = this.getDomHelper();
  var contentEl = component.getContentElement();
  component.forEachChild(function(item) {
	item.createDom();
	dom.appendChild(contentEl, item.getElement());
  }, this);
};

/** @inheritDoc */
closurekitchen.EditorPane.prototype.createDom = function() {
  var dom          = this.getDomHelper();
  var contentEl    = dom.createDom('div', closurekitchen.EditorPane.TABCONTENT_CLASS_NAME_);
  this.projNameEl_ = dom.createDom('span', null, this.getDisplayProjectName());
  this.toolbar_.createDom();
  this.tabBar_.createDom();
  this.createChildDom_(this.tabBar_);
  this.setElementInternal(dom.createDom(
	'div', closurekitchen.EditorPane.CLASS_NAME_,
	dom.createDom('div', closurekitchen.EditorPane.PROJNAME_CLASS_NAME_, this.projNameEl_),
	dom.createDom('div', closurekitchen.EditorPane.TABBAR_CLASS_NAME_,
				  this.tabBar_.getElement(),
				  dom.createDom('div', 'goog-tab-bar-clear')),
	contentEl));

  dom.appendChild(contentEl, this.toolbar_.getElement());
  goog.array.forEach(this.tabContents_, function(content) {
	content.createDom();
	dom.appendChild(contentEl, content.getElement());
  }, this);
}

/** @inheritDoc */
closurekitchen.EditorPane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.getHandler().
    listen(this.tabBar_,     goog.ui.Component.EventType.SELECT, this.onSelectTab_).
    listen(this.projNameEl_, goog.events.EventType.CLICK,        this.onClickProjName_);
  this.tabBar_.setSelectedTabIndex(0);
};

/** @inheritDoc */
closurekitchen.EditorPane.prototype.updateByStatusBundle = function(bundle) {
  var index = this.tabBar_.getSelectedTabIndex();
  if(this.tabContents_[index]) {
	bundle = this.tabContents_[index].updateStatusBundle(bundle);
  }
  goog.base(this, 'updateByStatusBundle', bundle);
  var status = bundle.getStatus(ActionID.RENAME_CURRENT_PROJECT);
  if(status && this.projNameEl_) {
	this.projNameEl_.parentNode.style.display = status.visible ? 'block' : 'none';
	this.renamable_ = status.enabled;
  }
};

});
