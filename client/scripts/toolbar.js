goog.provide('closurekitchen.Toolbar');
goog.provide('closurekitchen.ToolbarRenderer');
goog.require('goog.style');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.AutoComplete.Basic');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.ComponentBuilder');

goog.scope(function() {
var Toolbar      = goog.ui.Toolbar;
var Separator    = goog.ui.ToolbarSeparator;
var ActionID     = closurekitchen.ActionID;
var ActionEvent  = closurekitchen.ActionEvent;
var AutoComplete = goog.ui.AutoComplete.Basic;

/**
 * A toolbar for the editor pane.
 * @param {goog.dom.domHelper=} opt_domHelper A goog.dom.DomHelper instance.
 * @constructor
 * @extends {goog.ui.Toolbar}
 */
closurekitchen.Toolbar = function(opt_domHelper) {
  goog.base(this, null, null, opt_domHelper);
  var builder = new closurekitchen.ComponentBuilder(opt_domHelper);
  this.addChild(builder.buildToolbarItem(ActionID.NEW_PROJECT));
  this.addChild(builder.buildToolbarItem(ActionID.CLONE_CURRENT_PROJECT));
  this.addChild(builder.buildToolbarItem(ActionID.SAVE_CURRENT_PROJECT));
  this.addChild(new Separator(null, opt_domHelper));
  this.addChild(builder.buildToolbarItem(ActionID.UNDO));
  this.addChild(builder.buildToolbarItem(ActionID.REDO));
  this.addChild(new Separator(null, opt_domHelper));
  this.addChild(builder.buildToolbarItem(ActionID.UPDATE_PREVIEW));
  this.addChild(builder.buildToolbarItem(ActionID.PUBLISH_CURRENT_PROJECT));
  this.addChild(new Separator(null, opt_domHelper));
  this.addChild(builder.buildToolbarItem(ActionID.SEARCH, null, ActionID.SEARCH));
};
goog.inherits(closurekitchen.Toolbar, Toolbar);

/**
 * The auto-completion of the search field.
 * @type {goog.ui.AutoComplete.Basic}
 * @private
 */
closurekitchen.Toolbar.prototype.searchCompletion_;

/**
 * Set the auto-completion data to search field.
 * @param {Array.<string>} data the auto-completion data.
 */
closurekitchen.Toolbar.prototype.setSearchCompletion = function(data) {
  this.searchCompletion_ = new AutoComplete(
	data, this.getChild(ActionID.SEARCH).getContentElement());
};

/** @inheritDoc */
closurekitchen.Toolbar.prototype.disposeInternal = function() {
};

/** @inheritDoc */
closurekitchen.Toolbar.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var dom       = this.getDomHelper();
  var contentEl = this.getContentElement();
  this.forEachChild(function(item) {
	item.createDom();
	dom.appendChild(contentEl, item.getElement());
  }, this);
};

/** @inheritDoc */
closurekitchen.Toolbar.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // Make the search field selectable.
  goog.style.setUnselectable(
	this.getChild(ActionID.SEARCH).getElement(), false, goog.userAgent.GECKO);
}

/** @inheritDoc */
closurekitchen.Toolbar.prototype.exitDocument = function() {
  if(this.searchCompletion_) {
	this.searchCompletion_.dispose();
	this.searchCompletion_ = null;
  }
  goog.base(this, 'exitDocument');
}

});
