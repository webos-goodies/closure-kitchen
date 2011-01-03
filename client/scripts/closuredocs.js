goog.provide('closuredocs.App');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.ui.AnimatedZippy');

goog.scope(function() {
var Zippy = goog.ui.AnimatedZippy;

/**
 * An application class.
 * @constructor
 */
closuredocs.App = function() {
  this.privateEls   = [];
  this.protectedEls = [];

  var sectionEls = goog.dom.getElementsByTagNameAndClass('div', 'section');
  goog.array.forEach(sectionEls, function(sectionEl) {
	this.addZippy_(sectionEl);
	this.hideItems_(sectionEl, 'private');
	this.hideItems_(sectionEl, 'protected');
  }, this);

  goog.dom.classes.add(this.getCol1_(), 'func-hide-protectedkey', 'func-hide-privatekey');
};
goog.addSingletonGetter(closuredocs.App);

/**
 * Returns the wrapper div element.
 * @return {Element} The wrapper div element.
 * @private
 */
closuredocs.App.prototype.getCol1_ = function() {
  var els = goog.dom.getElementsByTagNameAndClass('div', 'col1');
  return els.length > 0 ? els[0] : null;
};

/**
 * Add zippy effect to entry details.
 * @param {Element} rootEl The root element.
 * @private
 */
closuredocs.App.prototype.addZippy_ = function(rootEl) {
  var detailEls = goog.dom.getElementsByTagNameAndClass('div', 'entryDetails', rootEl);
  goog.array.forEach(goog.array.clone(detailEls), function(detailEl) {
	new Zippy(detailEl.parentNode, detailEl);
  }, this);
};

/**
 * Hide private or protected members.
 * @param {Element} rootEl The root element.
 * @param {string} className class name to hide.
 * @private
 */
closuredocs.App.prototype.hideItems_ = function(rootEl, className) {
  var els = goog.dom.getElementsByTagNameAndClass('tr', className, rootEl);
  if(els.length > 0) {
	var expandEl = goog.dom.createDom(
	  'tr', 'funcs-hidden-' + className,
	  goog.dom.createDom('td', 'access'),
	  goog.dom.createDom('td', { 'class':className + 'key-toggle', 'colspan':'2' },
						 els.length <= 1 ?
						 els.length + ' hidden private item.' :
						 els.length + ' hidden private items.'));
	goog.dom.insertSiblingBefore(expandEl, els[els.length - 1]);
	goog.events.listen(
	  expandEl, goog.events.EventType.CLICK, goog.bind(this.showItems_, this, className));
  }
}

/**
 * Show hidden items
 * @param {string} className class name to show.
 * @private
 */
closuredocs.App.prototype.showItems_ = function(className) {
  goog.dom.classes.remove(this.getCol1_(), 'func-hide-' + className + 'key');
};

closuredocs.App.getInstance();

});
