goog.provide('closurekitchen.ComponentBuilder');
goog.require('goog.asserts');
goog.require('goog.dom.DomHelper');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuItemRenderer');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionType');
goog.require('closurekitchen.ActionMetaData');

/**
 * An UI component builder.
 * @param {goog.dom.DomHelper=} opt_domHelper The default dom helper.
 * @constructor
 */
closurekitchen.ComponentBuilder = function(opt_domHelper) {
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper();
};

/**
 * The current dom helper.
 * @type {goog.dom.DomHelper}
 */
closurekitchen.ComponentBuilder.prototype.domHelper_;

/**
 * Creates an toolbar button for the specified Action ID.
 * @param {closurekitchen.ActionID} id The action id of the button.
 * @param {*=} opt_data Optional argument of the action.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for document interaction.
 * @return {!goog.ui.Control} The created toolbar button.
 */
closurekitchen.ComponentBuilder.prototype.buildToolbarButton =
  function(id, opt_data, opt_domHelper)
{
  var meta = closurekitchen.ActionMetaData[id];
  goog.asserts.assert(meta, 'Unknown action id.');

  var rv    = null;
  var type  = meta.type;
  if(type == closurekitchen.ActionType.ONE_SHOT) {
	rv = new goog.ui.ToolbarButton(meta.content, null, opt_domHelper || this.domHelper_);
  }
  rv.setModel({ actionId: id, actionData: goog.isDef(opt_data) ? opt_data : null });
  rv.setTooltip(meta.tooltip);

  goog.asserts.assert(rv, 'Failed to build a toolbar button.');
  return rv;
};

/**
 * Creates a menu item for the specified action id.
 * @param {closurekitchen.ActionID} id The action id of the menu item.
 * @param {*=} opt_data Optional argument of the action.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for document interaction.
 * @param {goog.ui.MenuItemRenderer=} opt_renderer Optional renderer.
 * @return {!goog.ui.Control} The created menu item.
 */
closurekitchen.ComponentBuilder.prototype.buildMenuItem =
  function(id, opt_data, opt_domHelper, opt_renderer)
{
  var meta = closurekitchen.ActionMetaData[id];
  goog.asserts.assert(meta, 'Unknown action id.');

  var rv    = null;
  var type  = meta.type;
  var model = { actionId: id, actionData: goog.isDef(opt_data) ? opt_data : null };
  if(type == closurekitchen.ActionType.ONE_SHOT) {
	rv = new goog.ui.MenuItem(meta.content, model, opt_domHelper || this.domHelper_, null);
  }

  goog.asserts.assert(rv, 'Failed to build a menu item.');
  return rv;
};
