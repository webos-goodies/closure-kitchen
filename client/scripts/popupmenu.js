goog.provide('closurekitchen.PopupMenu');
goog.require('goog.ui.PopupMenu');
goog.require('closurekitchen.i18n');

/**
 * A PopupMenu class that supports ActionEvent.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @param {goog.ui.MenuRenderer=} opt_renderer Renderer used to render or
 *     decorate the container; defaults to {@link goog.ui.MenuRenderer}.
 * @extends {goog.ui.PopupMenu}
 * @constructor
 */
closurekitchen.PopupMenu = function(opt_domHelper, opt_renderer) {
  goog.base(this, opt_domHelper, opt_renderer);
};
goog.inherits(closurekitchen.PopupMenu, goog.ui.PopupMenu);

/** @inheritDoc */
closurekitchen.PopupMenu.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var eh = this.getHandler();
  handler.listen();
};
