goog.provide('closurekitchen.HtmlEditorTab');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.CodeMirrorTab');

/**
 * Component class of HTML tab in editor pane.
 * @constructor
 * @extends {closurekitchen.CodeMirrorTab}
 * @param {string} code The source code to edit.
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.HtmlEditorTab = function(code, opt_domHelper) {
  goog.base(this, closurekitchen.CodeMirrorTab.Language.HTML,
			closurekitchen.i18n.getMsg('HTML'), code, opt_domHelper);
};
goog.inherits(closurekitchen.HtmlEditorTab, closurekitchen.CodeMirrorTab);
