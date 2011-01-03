goog.provide('closurekitchen.ReferenceTab');
goog.require('closurekitchen.AbstractEditorTab');
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.dom.iframe');
goog.require('goog.style');

/**
 * A component class for the reference tab in the editor pane.
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 * @extends {closurekitchen.AbstractEditorTab}
 * @constructor
 */
closurekitchen.ReferenceTab = function(opt_domHelper) {
  goog.base(this, goog.getMsg('Reference'), opt_domHelper);
  this.iframe_ = null;
};
goog.inherits(closurekitchen.ReferenceTab, closurekitchen.AbstractEditorTab);

/**
 * iframe element to display the reference page.
 * @type {Element}
 * @private
 */
closurekitchen.ReferenceTab.prototype.iframe_;

/**
 * Change the current url.
 * @param {string} url The url of the reference page.
 */
closurekitchen.ReferenceTab.prototype.setContent = function(url) {
  if(this.iframe_) {
	this.iframe_.src = 'docs/' + url;
  }
};

/** @inheritDoc */
closurekitchen.ReferenceTab.prototype.disposeInternal = function() {
  this.iframe_ = null;
  goog.base(this, 'disposeInternal');
};

/** @inheritDoc */
closurekitchen.ReferenceTab.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var dom = this.getDomHelper();
  this.iframe_ = goog.dom.iframe.createBlank(dom, 'display:block;width:100%;height:100%');
  dom.appendChild(this.getElement(), this.iframe_);
};
