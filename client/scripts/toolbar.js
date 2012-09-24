goog.provide('closurekitchen.Toolbar');
goog.provide('closurekitchen.ToolbarRenderer');
goog.provide('closurekitchen.AutoComplete');
goog.provide('closurekitchen.AutoComplete.InputHandler');
goog.require('goog.style');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.ac.AutoComplete');
goog.require('goog.ui.ac.ArrayMatcher');
goog.require('goog.ui.ac.InputHandler');
goog.require('goog.ui.ac.Renderer');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.ComponentBuilder');

goog.scope(function() {
var Toolbar      = goog.ui.Toolbar;
var Separator    = goog.ui.ToolbarSeparator;
var ActionID     = closurekitchen.ActionID;
var ActionEvent  = closurekitchen.ActionEvent;

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
  this.addChild(builder.buildToolbarItem(ActionID.FIND_NEXT, null, ActionID.FIND_NEXT));
  this.addChild(builder.buildToolbarItem(ActionID.FIND_PREV, null, ActionID.FIND_PREV));
  this.addChild(new Separator(null, opt_domHelper));
  this.addChild(builder.buildToolbarItem(ActionID.ABOUT));
};
goog.inherits(closurekitchen.Toolbar, Toolbar);

/**
 * The auto-completion of the search field.
 * @type {closurekitchen.AutoComplete}
 * @private
 */
closurekitchen.Toolbar.prototype.searchCompletion_;

/**
 * Set the auto-completion data to search field.
 * @param {Array.<string>} data the auto-completion data.
 */
closurekitchen.Toolbar.prototype.setSearchCompletion = function(data) {
  this.searchCompletion_ = new closurekitchen.AutoComplete(
	data, this.getChild(ActionID.SEARCH).getContentElement());
  this.searchCompletion_.setAllowFreeSelect(true);
  this.searchCompletion_.setAutoHilite(false);
};

/**
 * This method is called when the find forward / backward button is clicked.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.Toolbar.prototype.onActionFind_ = function(e) {
  var model = e.target.getModel();
  if(model) {
	e.stopPropagation();
	ActionEvent.dispatch(this, model.actionId, this.getChild(ActionID.SEARCH).getContent());
  }
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

  // Listen the action event to modify its data.
  var eh = this.getHandler();
  eh.listen(this.getChild(ActionID.FIND_NEXT),
			goog.ui.Component.EventType.ACTION,
			this.onActionFind_);
  eh.listen(this.getChild(ActionID.FIND_PREV),
			goog.ui.Component.EventType.ACTION,
			this.onActionFind_);
}

/** @inheritDoc */
closurekitchen.Toolbar.prototype.exitDocument = function() {
  if(this.searchCompletion_) {
	this.searchCompletion_.dispose();
	this.searchCompletion_ = null;
  }
  goog.base(this, 'exitDocument');
}


/**
 * Factory class for building a basic autocomplete widget that autocompletes
 * an inputbox or text area from a data array.
 * @param {Array} data Data array.
 * @param {Element} input Input element or text area.
 * @param {boolean=} opt_multi Whether to allow multiple entries separated with
 * semi-colons or commas.
 * @param {boolean=} opt_useSimilar use similar matches. e.g. "gost" => "ghost".
 * @constructor
 * @extends {goog.ui.ac.AutoComplete}
 */
closurekitchen.AutoComplete = function(data, input, opt_multi, opt_useSimilar) {
  var matcher  = new goog.ui.ac.ArrayMatcher(data, !opt_useSimilar);
  var renderer = new goog.ui.ac.Renderer();
  var inputhandler =
      new closurekitchen.AutoComplete.InputHandler(null, null, !!opt_multi);

  goog.base(this, matcher, renderer, inputhandler);

  inputhandler.attachAutoComplete(this);
  inputhandler.attachInputs(input);
};
goog.inherits(closurekitchen.AutoComplete, goog.ui.ac.AutoComplete);


/**
 * Class for managing the interaction between an auto-complete object and a
 * text-input or textarea.
 *
 * @param {?string=} opt_separators Separators to split multiple entries.
 * @param {?string=} opt_literals Characters used to delimit text literals.
 * @param {?boolean=} opt_multi Whether to allow multiple entries
 *     (Default: true).
 * @param {?number=} opt_throttleTime Number of milliseconds to throttle
 *     keyevents with (Default: 150). Use -1 to disable updates on typing. Note
 *     that typing the separator will update autocomplete suggestions.
 * @constructor
 * @extends {goog.ui.ac.InputHandler}
 */
closurekitchen.AutoComplete.InputHandler = function(
  opt_separators, opt_literals, opt_multi, opt_throttleTime) {
  goog.base(this, opt_separators, opt_literals, opt_multi, opt_throttleTime);
}
goog.inherits(closurekitchen.AutoComplete.InputHandler, goog.ui.ac.InputHandler);

/** @inheritDoc */
closurekitchen.AutoComplete.InputHandler.prototype.getValue = function() {
  return goog.base(this, 'getValue').replace(/^doc:/, '');
};

/** @inheritDoc */
closurekitchen.AutoComplete.InputHandler.prototype.setValue = function(value) {
  goog.base(this, 'setValue', 'doc:' + value);
};

});
