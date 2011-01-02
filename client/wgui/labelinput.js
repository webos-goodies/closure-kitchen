goog.provide('wgui.LabelInput');
goog.require('goog.dom.DomHelper');
goog.require('goog.style');
goog.require('goog.events.EventType');
goog.require('goog.events.EventHandler');
goog.require('goog.debug.Logger');
goog.require('wgui.TextInput');

/**
 * A text input with label displayed when it is empty.
 * @param {string} content The text to set as the input element's value.
 * @param {string} label The text to show as the label.
 * @param {wgui.TextInputRenderer=} opt_renderer Renderer used to render or
 *     decorate the input. Defaults to {@link wgui.TextInputRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {wgui.TextInput}
 */
wgui.LabelInput = function(content, label, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer, opt_domHelper);
  this.label_ = label || '';
};
goog.inherits(wgui.LabelInput, wgui.TextInput);

/**
 * The CSS class name to add to the input when the user has not entered a
 * value.
 * @type {string}
 */
wgui.LabelInput.LABEL_CSS_CLASS = goog.getCssName('wgui-textinput-label');

/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 * @private
 */
wgui.LabelInput.logger_ = goog.debug.Logger.getLogger('wgui.LabelInput');

/**
 * The text to show as the label.
 * @type {string}
 * @private
 */
wgui.LabelInput.prototype.label_;

/**
 * @type {boolean}
 * @private
 */
wgui.LabelInput.prototype.hasFocus_;

/** @inheritDoc */
wgui.LabelInput.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var dom       = this.getDomHelper();
  this.labelEl_ = dom.createDom('div', {
	'class': wgui.LabelInput.LABEL_CSS_CLASS,
	'style': 'display:none;'
  }, this.label_);
  dom.insertSiblingBefore(this.labelEl_, this.getContentElement());
};

/** @inheritDoc */
wgui.LabelInput.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var dom = this.getDomHelper();
  var eh  = this.getHandler();
  var el  = this.getContentElement();
  eh.listen(el, goog.events.EventType.FOCUS,  this.handleFocus_);
  eh.listen(el, goog.events.EventType.BLUR,   this.handleBlur_);
  eh.listen(el, goog.events.EventType.CHANGE, this.handleChange_);

  eh.listen(this.labelEl_, goog.events.EventType.CLICK, this.handleClick_);

  // IE sets defaultValue upon load so we need to test that as well.
  var d = dom.getOwnerDocument(el);
  var w = dom.getWindow(d);
  eh.listen(w, goog.events.EventType.LOAD, this.handleWindowLoad_);

  this.updateLabel_();

  // Make it easy for other closure widgets to play nicely with inputs using
  // LabelInput:
  el.labelInput_ = this;
};

/**
 * Called when the DOM for the component is removed from the document or
 * when the component no longer is managing the DOM.
 */
wgui.LabelInput.prototype.exitDocument = function() {
  this.getContentElement().labelInput_ = null;
  goog.base(this, 'exitDocument');
};

/**
 * Handler for the focus event.
 * @param {goog.events.Event} e The event object passed in to the event handler.
 * @private
 */
wgui.LabelInput.prototype.handleFocus_ = function(e) {
  this.hasFocus_ = true;
  this.updateLabel_();
};

/**
 * Handler for the blur event.
 * @param {goog.events.Event} e The event object passed in to the event handler.
 * @private
 */
wgui.LabelInput.prototype.handleBlur_ = function(e) {
  this.hasFocus_ = false;
  this.updateLabel_();
};

/**
 * Handler for the change event.
 * @param {goog.events.Event} e The event object passed in to the event handler.
 * @private
 */
wgui.LabelInput.prototype.handleChange_ = function(e) {
  if(!this.hasFocus_) {
	this.updateLabel_();
  }
};

/**
 * Handler for the click event on the label.
 * @param {goog.events.Event} e The event object passed in to the event handler.
 * @private
 */
wgui.LabelInput.prototype.handleClick_ = function(e) {
  wgui.LabelInput.logger_.fine('Click on the label.');
  var el = this.getContentElement();
  if(el) {
	el.focus();
  }
};

/**
 * Handler for the load event the window. This is needed because
 * IE sets defaultValue upon load.
 * @param {Event} e The event object passed in to the event handler.
 * @private
 */
wgui.LabelInput.prototype.handleWindowLoad_ = function(e) {
  this.updateLabel_();
};

/**
 * Set the label text.
 * @param {string} s The new label text.
 */
wgui.LabelInput.prototype.setLabel = function(s) {
  this.label_ = s;
  if(this.labelEl_) {
	this.getDomHelper().setTextContent(this.labelEl_, this.label_);
  }
};

/**
 * Returns the label text.
 * @return {string} The label text.
 */
wgui.LabelInput.prototype.getLabel = function() {
  return this.label_;
};

/**
 * Checks the state of the input element and show / hide the label.
 * @private
 */
wgui.LabelInput.prototype.updateLabel_ = function() {
  if(this.labelEl_) {
	var showLabel = !this.getContent() && !this.hasFocus_;
	goog.style.showElement(this.labelEl_, showLabel);
  }
};
