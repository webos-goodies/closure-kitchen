goog.provide('closurekitchen.PreviewTab');
goog.require('closurekitchen.AbstractEditorTab');
goog.require('goog.dom');
goog.require('goog.dom.iframe');

/**
 * A component class for the preview tab in the editor pane.
 * @constructor
 * @extends {closurekitchen.AbstractEditorTab}
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.PreviewTab = function(opt_domHelper) {
  goog.base(this, 'Preview', opt_domHelper);
  this.iframe_ = null;
};
goog.inherits(closurekitchen.PreviewTab, closurekitchen.AbstractEditorTab);

/**
 * iframe element for displaying preview.
 * @type {Element}
 * @private
 */
closurekitchen.PreviewTab.prototype.iframe_;

/**
 * Updates preview.
 * @param {string} html html code to display.
 */
closurekitchen.PreviewTab.prototype.setContent = function(html) {
  var dom = this.getDomHelper();
  if(this.iframe_) {
	dom.removeNode(this.iframe_);
	this.iframe_ = null;
  }
  this.iframe_ = goog.dom.iframe.createBlank(dom, 'display:block;width:100%;height:100%');
  dom.appendChild(this.getContentElement(), this.iframe_);
  goog.dom.iframe.writeContent(this.iframe_, html);
};
