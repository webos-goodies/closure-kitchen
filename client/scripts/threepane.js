goog.provide('closurekitchen.ThreePane');
goog.require('goog.dom.DomHelper');
goog.require('goog.style');
goog.require('goog.ui.SplitPane');
goog.require('closurekitchen.i18n');

/**
 * 3 pane layout component.
 * @param {goog.ui.Component} left The right pane component.
 * @param {goog.ui.Component} right The left pane component.
 * @param {goog.ui.Component} bottom The bottom pane component.
 * @param {goog.math.Size} size Initial size of the component.
 * @param {{ hpos:number, vpos:number }} pos The split positions.
 * @param {goog.dom.DomHelper} opt_domHelper Optional dom helper.
 * @constructor
 * @extends {goog.ui.SplitPane}
 */
closurekitchen.ThreePane = function(left, right, bottom, size, pos, opt_domHelper) {
  var leftSize   = pos.hpos || Math.min(200, size.width / 2);
  var bottomSize = pos.vpos || size.height * 0.3;
  if(leftSize > size.width - 10)
	leftSize = size.width / 2;
  if(bottomSize > size.height - 10)
	bottomSize = size.height / 2;
  this.splitPane_ = new closurekitchen.ThreePane.SplitPane(
	right, bottom, goog.ui.SplitPane.Orientation.VERTICAL, opt_domHelper);
  this.splitPane_.setInitialSize(size.height - bottomSize - 5);
  goog.base(this, left, this.splitPane_, goog.ui.SplitPane.Orientation.HORIZONTAL, opt_domHelper);
  this.setInitialSize(leftSize);
};
goog.inherits(closurekitchen.ThreePane, goog.ui.SplitPane);

/**
 * The vertical split pane.
 * @type {closurekitchen.ThreePane.SplitPane}
 * @private
 */
closurekitchen.ThreePane.prototype.splitPane_;

/**
 * Call the instance is initialized.
 */
closurekitchen.ThreePane.prototype.finishInitialization = function() {
  this.splitPane_.finishInitialization();
};

/**
 * Returns an object contains devided positions.
 * @return {{ hpos:number, vpos:number }}
 */
closurekitchen.ThreePane.prototype.exportSettings = function() {
  var console = this.splitPane_.getChildAt(1);
  var size    = goog.style.getBorderBoxSize(console.getElement());
  return { hpos: this.getFirstComponentSize(), vpos: size.height };
};

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
  this.initialized_ = false;
};
goog.inherits(closurekitchen.ThreePane.SplitPane, goog.ui.SplitPane);

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.ThreePane.SplitPane.logger_ =
  goog.debug.Logger.getLogger('closurekitchen.ThreePane.SplitPane');

/**
 * True if the instance is initialized.
 * @type {boolean}
 * @private
 */
closurekitchen.ThreePane.SplitPane.prototype.initialized_;

/**
 * Resize the component.
 * @param {goog.math.Size} size The size to fit.
 */
closurekitchen.ThreePane.SplitPane.prototype.resize = function(size) {
  if(this.initialized_) {
	var oldSize = goog.style.getBorderBoxSize(this.getElement());
	var topSize = this.getFirstComponentSize();
	this.setSize(size);
	this.setFirstComponentSize(topSize + size.height - oldSize.height);
  } else {
	this.setSize(size);
  }
};

/**
 * Call the instance is initialized.
 */
closurekitchen.ThreePane.SplitPane.prototype.finishInitialization = function() {
  this.initialized_ = true;
};
