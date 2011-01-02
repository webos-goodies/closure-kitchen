goog.provide('wgui.TextInputRenderer');

goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.INLINE_BLOCK_CLASSNAME');


/**
 * Renderer for {@link wgui.TextInput}s.  Renders and decorates native HTML
 * input elements.  Since native HTML input have built-in support for many
 * features, overrides many expensive (and redundant) superclass methods to
 * be no-ops.
 * @constructor
 * @extends {goog.ui.ControlRenderer}
 */
wgui.TextInputRenderer = function() {
  goog.ui.ControlRenderer.call(this);
};
goog.inherits(wgui.TextInputRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(wgui.TextInputRenderer);

/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
wgui.TextInputRenderer.CSS_CLASS = goog.getCssName('wgui-textinput');

/**
 * Returns whether the element is a text input or not.
 * @param {Element} element The element to test.
 * @return {boolean} true if the element is a text input. false otherwise.
 * @private
 */
wgui.TextInputRenderer.isTextInput_ = function(element) {
  return (element.tagName == goog.dom.TagName.INPUT &&
          (!element.type || element.type.toUpperCase() == 'TEXT'));
};

/**
 * Returns the first text input in element.
 * @param {Element} element The element to find.
 * @return {Element} The first text input in element or null if element
 *     has no text input.
 * @private
 */
wgui.TextInputRenderer.findTextInput_ = function(element) {
  var inputs = element.getElementsByTagName('input');
  for(var i = 0 ; i < inputs.length ; ++i) {
    var el = inputs[i];
    if(!el.type || el.type.toUpperCase() == 'TEXT') {
      return el;
    }
  }
  return null;
};

/** @inheritDoc */
wgui.TextInputRenderer.prototype.getAriaRole = function() {
  // inputs don't need ARIA roles to be recognized by screen readers.
  return undefined;
};

/**
 * Builds the DOM structure under the specified element.
 * @param {Element} root The root element of TextInput component.
 * @param {Element} input The input element.
 * @param {goog.dom.DomHelper} dom A dom helper to manipulate the DOM tree.
 * @returns {Element} The DOM structure of TextInput.
 */
wgui.TextInputRenderer.prototype.buildTextInput = function(root, input, dom) {
  var innerBox = dom.createDom(
    'div', goog.getCssName(this.getCssClass(), 'inner-box'));
  var outerBox = dom.createDom(
    'div', goog.getCssName(this.getCssClass(), 'outer-box'), innerBox);
  dom.appendChild(root, outerBox);
  dom.appendChild(innerBox, input);
};

/** @inheritDoc */
wgui.TextInputRenderer.prototype.decorate = function(control, element) {
  var dom   = control.getDomHelper();
  var input = element;

  // wrap the input element by div.
  element = dom.createDom('div', goog.ui.INLINE_BLOCK_CLASSNAME);
  dom.insertSiblingBefore(element, input);
  this.buildTextInput(element, input, dom);

  goog.base(this, 'decorate', control, element);
  control.setContentInternal(input.value);
  return element;
};

/**
 * Returns the text input's contents wrapped in an HTML input element.
 * Sets the text input's disabled attribute as needed.
 * @param {goog.ui.Control} control TextInput to render.
 * @return {Element} Root element for the TextInput control
 * @override
 */
wgui.TextInputRenderer.prototype.createDom = function(control) {
  var dom     = control.getDomHelper();
  var element = dom.createDom(
    'div',
    goog.ui.INLINE_BLOCK_CLASSNAME + ' ' +
    this.getClassNames(control).join(' '));
  var input = dom.createDom('input', {
    'type':     'text',
    'value':    control.getContent() || '',
    'disabled': !control.isEnabled() });
  this.buildTextInput(element, input, dom);
  return element;
};

/** @inheritDoc */
wgui.TextInputRenderer.prototype.canDecorate = function(element) {
  return wgui.TextInputRenderer.isTextInput_(element);
};

/**
 * Content element is the first text input in the root element.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.getContentElement = function(element) {
  return element ? wgui.TextInputRenderer.findTextInput_(element) : null;
};

/** @inheritDoc */
wgui.TextInputRenderer.prototype.getKeyEventTarget = function(control) {
  return this.getContentElement(control.getElement());
};

/**
 * Inputs natively support right-to-left rendering.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.setRightToLeft = goog.nullFunction;

/**
 * Inputs are always focusable as long as they are enabled.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.isFocusable = function(control) {
  return control.isEnabled();
};

/**
 * Inputs natively support keyboard focus.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.setFocusable = goog.nullFunction;

/**
 * Inputs also expose the DISABLED state in the HTML input's
 * {@code disabled} attribute.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.setState = function(control, state, enable) {
  goog.base(this, 'setState', control, state, enable);
  if(state == goog.ui.Component.State.DISABLED) {
    var element = this.getContentElement(control.getElement());
    if (element) {
      element.disabled = enable;
    }
  }
};

/**
 * Inputs don't need ARIA states to support accessibility, so this is
 * a no-op.
 * @inheritDoc
 */
wgui.TextInputRenderer.prototype.updateAriaState = goog.nullFunction;

/** @inheritDoc **/
wgui.TextInputRenderer.prototype.setContent = function(element, value) {
  contentElement = this.getContentElement(element);
  if (contentElement) {
    contentElement.value = value;
  }
};

/**
 * Returns the value of the text input.
 * @param {Element} element The root element.
 * @return {?string} The value of the text input.
 */
wgui.TextInputRenderer.prototype.getContent = function(element) {
  contentElement = this.getContentElement(element);
  return contentElement ? contentElement.value : null;
};

/** @inheritDoc **/
wgui.TextInputRenderer.prototype.getCssClass = function() {
  return wgui.TextInputRenderer.CSS_CLASS;
};
