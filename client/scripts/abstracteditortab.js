goog.provide('closurekitchen.AbstractEditorTab');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.Component');
goog.require('closurekitchen.i18n');

/**
 * An abstract tab content of the editor pane.
 * @constructor
 * @extends {goog.ui.Component}
 * @param {string} caption The string displayed in tab.
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.AbstractEditorTab = function(caption, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.caption_ = goog.string.htmlEscape(caption);
};
goog.inherits(closurekitchen.AbstractEditorTab, goog.ui.Component);

/**
 * CSS class name of root element.
 * @type {string}
 * @constant
 */
closurekitchen.AbstractEditorTab.CLASS_NAME_ = goog.getCssName('editorcontent');

/**
 * The string displayed in tab.
 * @type {Object}
 * @private
 */
closurekitchen.AbstractEditorTab.prototype.caption_;

/**
 * Returns the caption text.
 * @return {string} The caption text.
 */
closurekitchen.AbstractEditorTab.prototype.getCaption = function() {
  return this.caption_;
};

/**
 * Shows/hides the tab contents.
 * @param {boolean} flag If true, the tab contents will be shown. Otherwise will be hidden.
 */
closurekitchen.AbstractEditorTab.prototype.showContent = function(flag) {
  goog.style.showElement(this.getElement(), flag);
};

/**
 * Resizes the content.
 * @param {goog.math.Size} size The size of the content.
 */
closurekitchen.AbstractEditorTab.prototype.resize = function(size) {
  goog.style.setSize(this.getElement(), size);
};

/**
 * Reflect the tab status to the status bundle.
 * @param {closurekitchen.StatusBundle} bundle The status bundle.
 * @return {closurekitchen.StatusBundle} The new status bundle.
 */
closurekitchen.AbstractEditorTab.prototype.updateStatusBundle = function(bundle) {
  return bundle;
};

/**
 * Execute the action.
 * @param {closurekitchen.ActionID} actionId ID of the action to execute.
 * @param {*=} opt_data Optional argument of the action.
 */
closurekitchen.AbstractEditorTab.prototype.doAction = goog.nullFunction;

/** @inheritDoc */
closurekitchen.AbstractEditorTab.prototype.createDom = function() {
  var dom = this.getDomHelper();
  this.setElementInternal(
	dom.createDom('div', closurekitchen.AbstractEditorTab.CLASS_NAME_));
}
