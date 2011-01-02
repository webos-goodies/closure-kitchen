goog.provide('closurekitchen.ComponentBuilder');
goog.require('goog.asserts');
goog.require('goog.dom.DomHelper');
goog.require('goog.Timer');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuItemRenderer');
goog.require('wgui.TextInput');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionType');
goog.require('closurekitchen.ActionEvent');
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
 * Creates an toolbar item for the specified Action ID.
 * @param {closurekitchen.ActionID} id The action id of the button.
 * @param {*=} opt_data Optional argument of the action.
 * @param {string=} opt_componentId Optional component id.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for document interaction.
 * @return {!goog.ui.Control} The created toolbar button.
 */
closurekitchen.ComponentBuilder.prototype.buildToolbarItem =
  function(id, opt_data, opt_componentId, opt_domHelper)
{
  var dom  = opt_domHelper || this.domHelper_;
  var meta = closurekitchen.ActionMetaData[id];
  goog.asserts.assert(meta, 'Unknown action id.');

  var rv      = null;
  var type    = meta.type;
  var content = meta.content;
  if(meta.cls) {
	content = dom.createDom('div', meta.cls);
  }
  if(type == closurekitchen.ActionType.ONE_SHOT) {
	rv = new goog.ui.ToolbarButton(content, null, dom);
  } else if(type == closurekitchen.ActionType.TEXT) {
	rv = new wgui.TextInput(content, null, dom);
	if(rv) {
	  goog.events.listen(rv, goog.ui.Component.EventType.ACTION,
						 closurekitchen.ComponentBuilder.handleActionText_);
	}
  }
  goog.asserts.assert(rv, 'Failed to build a toolbar item.');

  rv.setModel({ actionId: id, actionData: goog.isDef(opt_data) ? opt_data : null });
  if(meta.tooltip && goog.isFunction(rv.setTooltip)) {
	rv.setTooltip(meta.tooltip);
  }
  if(opt_componentId) {
	rv.setId(opt_componentId);
  }

  return rv;
};

/**
 * Creates a menu item for the specified action id.
 * @param {closurekitchen.ActionID} id The action id of the menu item.
 * @param {*=} opt_data Optional argument of the action.
 * @param {string=} opt_componentId Optional component id.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for document interaction.
 * @return {!goog.ui.Control} The created menu item.
 */
closurekitchen.ComponentBuilder.prototype.buildMenuItem =
  function(id, opt_data, opt_componentId, opt_domHelper)
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

  if(opt_componentId) {
	rv.setId(opt_componentId);
  }

  return rv;
};

/**
 * This function is called when the enter key is pressed in a text input.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.ComponentBuilder.handleActionText_ = function(e) {
  var target = e.target;
  var model  = target.getModel();
  if(model && model.actionId) {
	e.stopPropagation();
	goog.Timer.callOnce(
	  goog.partial(closurekitchen.ComponentBuilder.delayedActionText_, target));
  }
};

/**
 * This function is called when the enter key is pressed in a text input.
 * @param {goog.ui.Component} component The target component.
 * @private
 */
closurekitchen.ComponentBuilder.delayedActionText_ = function(target) {
  var model  = target.getModel();
  if(model && model.actionId) {
	closurekitchen.ActionEvent.dispatch(target, model.actionId, target.getContent());
  }
};
