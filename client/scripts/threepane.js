goog.provide('closurekitchen.ThreePane');
goog.require('goog.dom.DomHelper');
goog.require('goog.ui.SplitPane');

/**
 * 3 pane layout component.
 * @param {goog.ui.Component} left The right pane component.
 * @param {goog.ui.Component} right The left pane component.
 * @param {goog.ui.Component} bottom The bottom pane component.
 * @param {goog.math.Size} size Initial size of the component.
 * @param {goog.dom.DomHelper} opt_domHelper Optional dom helper.
 * @constructor
 * @extends {goog.ui.SplitPane}
 */
closurekitchen.ThreePane = function(left, right, bottom, size, opt_domHelper) {
  var leftSize   = 200;
  var bottomSize = 200;
  this.splitPane_ = new closurekitchen.ThreePane.SplitPane(
	left, right, goog.ui.SplitPane.Orientation.HORIZONTAL, opt_domHelper);
  this.splitPane_.setInitialSize(leftSize);
  goog.base(this, this.splitPane_, bottom, goog.ui.SplitPane.Orientation.VERTICAL, opt_domHelper);
  this.setInitialSize(size.height - bottomSize - 5);
};
goog.inherits(closurekitchen.ThreePane, goog.ui.SplitPane);

/**
 * The vertical split pane.
 * @type {closurekitchen.ThreePane.SplitPane}
 * @private
 */
closurekitchen.ThreePane.prototype.splitPane_;

/**
 * Vertical split pane with resize method.
 * @param {goog.ui.Component} firstComponent Left or Top component.
 * @param {goog.ui.Component} secondComponent Right or Bottom component.
 * @param {goog.ui.SplitPane.Orientation} orientation SplitPane orientation.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.SplitPane}
 */
closurekitchen.ThreePane.SplitPane =
  function(firstComponent, secondComponent, orientation, opt_domHelper)
{
  goog.base(this, firstComponent, secondComponent, orientation, opt_domHelper);
};
goog.inherits(closurekitchen.ThreePane.SplitPane, goog.ui.SplitPane);

/**
 * Resize the component.
 * @param {goog.math.Size} size The size to fit.
 */
closurekitchen.ThreePane.SplitPane.prototype.resize = function(size) {
  this.setSize(size);
};
