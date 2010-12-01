goog.provide('closurekitchen.ConsolePane');
goog.require('goog.style');
goog.require('goog.ui.Component');
goog.require('goog.ui.PopupMenu');
goog.require('goog.debug.DivConsole');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.ComponentBuilder');

goog.scope(function() {
var ActionID = closurekitchen.ActionID;

/**
 * A component of console pane.
 * @param {goog.Uri} uri The uri of the page.
 * @param {goog.dom.domHelper=} opt_domHelper A goog.dom.DomHelper instance.
 * @constructor
 * @extends {goog.ui.Component}
 */
closurekitchen.ConsolePane = function(uri, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.debugMode_ = uri.getParameterValue('Debug') == 'true';

  var builder = new closurekitchen.ComponentBuilder(opt_domHelper);
  this.contextMenu_ = new goog.ui.PopupMenu(opt_domHelper);
  this.contextMenu_.addChild(builder.buildMenuItem(ActionID.CLEAR_CONSOLE), true);
};
goog.inherits(closurekitchen.ConsolePane, goog.ui.Component);

/**
 * CSS class name of root element.
 * @type {string}
 * @constant
 * @private
 */
closurekitchen.ConsolePane.CLASS_NAME_ = goog.getCssName('consolepane');

/**
 * DivConsole instance.
 * @type {goog.debug.DivConsole}
 * @private
 */
closurekitchen.ConsolePane.divConsole_ = null;

/**
 * If this flag is true, the application log is displayed.
 * @type {boolean}
 * @private
 */
closurekitchen.ConsolePane.prototype.debugMode_;

/**
 * Context menu.
 * @type {goog.ui.PopupMenu}
 * @private
 */
closurekitchen.ConsolePane.prototype.contextMenu_;

/**
 * Append log.
 * @param {Object} logRecord The log entry.
 */
closurekitchen.ConsolePane.addLogRecord = function(logRecord) {
  if(closurekitchen.ConsolePane.divConsole_) {
	var record = new goog.debug.LogRecord(
	  logRecord['level'], logRecord['msg'], logRecord['loggerName'], logRecord['time']);
	record.setException(logRecord['exception']);
	record.setExceptionText(logRecord['exceptionText']);
	closurekitchen.ConsolePane.divConsole_.addLogRecord(record);
  }
};
goog.exportSymbol(
  'closurekitchen.ConsolePane.addLogRecord',
  closurekitchen.ConsolePane.addLogRecord);

/**
 * Append log.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 */
closurekitchen.ConsolePane.addLog = function(level, msg, loggerName) {
  if(closurekitchen.ConsolePane.divConsole_) {
	closurekitchen.ConsolePane.divConsole_.addLogRecord(new goog.debug.LogRecord(
	  level, msg, loggerName));
  }
};

/**
 * Clear console.
 */
closurekitchen.ConsolePane.prototype.clear = function() {
  if(closurekitchen.ConsolePane.divConsole_) {
	closurekitchen.ConsolePane.divConsole_.clear();
  }
};

/**
 * This method is called by the SplitPane when the browser window is resized.
 * @param {goog.math.Size} size The size of the pane.
 */
closurekitchen.ConsolePane.prototype.resize = function(size) {
  goog.style.setSize(this.getElement(), size.width - 2, size.height - 2);
};

/**
 * An event handler for ACTION event from the context menu.
 * @param {goog.events.Event} e The event object.
 * @private
 */
closurekitchen.ConsolePane.prototype.onMenuAction_ = function(e) {
  var model    = e.target.getModel();
  var actionId = model && model.actionId;
  if(actionId) {
	closurekitchen.ActionEvent.dispatch(this, actionId);
  }
};

/** @inheritDoc */
closurekitchen.ConsolePane.prototype.createDom = function() {
  var dom  = this.getDomHelper();
  var root = dom.createDom('div', {
	'class': closurekitchen.ConsolePane.CLASS_NAME_,
	'style': 'font-size:12px; overflow:auto;' });
  this.setElementInternal(root);
  this.contextMenu_.render();
}

/** @inheritDoc */
closurekitchen.ConsolePane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  if(!closurekitchen.ConsolePane.divConsole_) {
	closurekitchen.ConsolePane.divConsole_ = new goog.debug.DivConsole(this.getElement());
	closurekitchen.ConsolePane.divConsole_.setCapturing(this.debugMode_);
  }
  this.contextMenu_.attach(this.getElement(), undefined, undefined, true);
  this.getHandler().listen(
	this.contextMenu_, goog.ui.Component.EventType.ACTION, this.onMenuAction_);
};

/** @inheritDoc */
closurekitchen.ConsolePane.prototype.exitDocument = function() {
  if(closurekitchen.ConsolePane.divConsole_) {
	closurekitchen.ConsolePane.divConsole_.dispose();
	closurekitchen.ConsolePane.divConsole_ = null;
  }
  this.contextMenu_.detachAll();
  goog.base(this, 'exitDocument');
};

/** @inheritDoc */
closurekitchen.ConsolePane.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.contextMenu_ && this.contextMenu_.dispose();
  this.contextMenu_ = null;
};

});
