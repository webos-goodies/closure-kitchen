goog.provide('closurekitchen.CompiledCodeTab');
goog.require('goog.string');
goog.require('goog.dom.DomHelper');
goog.require('closurekitchen.AbstractEditorTab');

/**
 * A component class to show the compiled javascript code.
 * @constructor
 * @extends {closurekitchen.AbstractEditorTab}
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.CompiledCodeTab = function(opt_domHelper) {
  goog.base(this, 'Compiled Code', opt_domHelper);
};
goog.inherits(closurekitchen.CompiledCodeTab, closurekitchen.AbstractEditorTab);

/**
 * Updates the content.
 * @param {string} content A compiled javascript code.
 */
closurekitchen.CompiledCodeTab.prototype.setContent = function(content) {
  var lines = goog.string.htmlEscape(content, true).split('\n');
  var html  = [];
  for(var i = 0, l = lines.length * 3 ; i < l ; i += 3) {
	html[i]   = '<li>';
	html[i+1] = lines[i/3];
	html[i+2] = '</li>';
  }
  this.getElement().innerHTML =
	'<div class="compiledcode"><ol>' + html.join('') + '</ol></div>';
};
