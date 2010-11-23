goog.provide('closurekitchen.JsEditorTab');
goog.require('closurekitchen.CodeMirrorTab');

/**
 * Component class of JavaScript tab in editor pane.
 * @constructor
 * @extends {closurekitchen.CodeMirrorTab}
 * @param {string} code The source code to edit.
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.JsEditorTab = function(code, opt_domHelper) {
  goog.base(this, closurekitchen.CodeMirrorTab.Language.JAVASCRIPT,
			'JavaScript', code, opt_domHelper);
};
goog.inherits(closurekitchen.JsEditorTab, closurekitchen.CodeMirrorTab);
