goog.provide('wgui.TextInput');
goog.require('goog.ui.Control');
goog.require('wgui.TextInputRenderer');

/**
 * A single line text field with consistent look & feel on all browsers.
 *
 * @param {string} content The text to set as the input element's value.
 * @param {wgui.TextInputRenderer=} opt_renderer Renderer used to render or
 *     decorate the input. Defaults to {@link wgui.TextInputRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Control}
 */
wgui.TextInput = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content,
            opt_renderer || wgui.TextInputRenderer.getInstance(),
            opt_domHelper);

  this.setHandleMouseEvents(false);
  this.setAllowTextSelection(true);
  this.setAutoStates(goog.ui.Component.State.ALL, false);
  this.setSupportedState(goog.ui.Component.State.FOCUSED, false);
  if (!content) {
    this.setContentInternal('');
  }
};
goog.inherits(wgui.TextInput, goog.ui.Control);

/**
 * Override enterDocument to dispatch action event even FOCUSED state is not supported.
 * @inheritDoc
 */
wgui.TextInput.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var keyTarget = this.getKeyEventTarget();
  if(keyTarget) {
	var keyHandler = this.getKeyHandler();
	keyHandler.attach(keyTarget);
	this.getHandler().listen(
	  keyHandler, goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent);
  }
};

/**
 * Alias of setContent
 * @param {?string} content A string to set as the value of the input element.
 * @private
 */
wgui.TextInput.prototype.setCaption = function(content) {
  this.setContent(content);
};

/**
 * Alias of setContent
 * @param {?string} content A string to set as the value of the input element.
 * @private
 */
wgui.TextInput.prototype.setValue = function(content) {
  this.setContent(content);
};

/**
 * Returns the value of the text input.
 * @return {?string} the value of the text input.
 */
wgui.TextInput.prototype.getContent = function() {
  var el = this.getElement();
  if(el) {
	return this.getRenderer().getContent(this.getElement());
  } else {
	return goog.base(this, 'getContent');
  }
};

/**
 * Alias of getContent
 * @return {?string} the value of the input element.
 * @private
 */
wgui.TextInput.prototype.getValue = function() {
  return this.getContent();
};

/**
 * Alias of getContent
 * @return {?string} the value of the input element.
 * @private
 */
wgui.TextInput.prototype.getCaption = function() {
  return this.getContent();
};
