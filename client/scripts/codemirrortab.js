goog.provide('closurekitchen.CodeMirrorTab');
goog.require('goog.asserts');
goog.require('goog.debug.Logger');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.ActionID');
goog.require('closurekitchen.ActionEvent');
goog.require('closurekitchen.StatusBundle');
goog.require('closurekitchen.AbstractEditorTab');

goog.scope(function() {
var ActionID    = closurekitchen.ActionID;
var ActionEvent = closurekitchen.ActionEvent;

/**
 * A base class of CodeMirror tab content.
 * @constructor
 * @extends {closurekitchen.AbstractEditorTab}
 * @param {closurekitchen.CodeMirrorTab.Language} language Specify the programming language of the editing file.
 * @param {string} caption The string displayed in tab.
 * @param {?string} code The source code to edit.
 * @param {goog.dom.domHelper=} opt_domHelper The goog.dom.DomHelper instance.
 */
closurekitchen.CodeMirrorTab = function(language, caption, code, opt_domHelper) {
  goog.base(this, caption, opt_domHelper);

  this.config_ = {
	'parserfile':      [],
	'height':          '100%',
	'lineNumbers':     true,
	'autoMatchParens': true,
	'content':         code || '',
	'initCallback':    goog.bind(this.initEditor_, this),
	'saveFunction':    goog.bind(this.onSave_, this)
  };
  if(language == closurekitchen.CodeMirrorTab.Language.JAVASCRIPT) {
	if(closurekitchen.CodeMirrorTab.LOCAL_MODE) {
	  this.config_['path']       = 'codemirror/js/';
	  this.config_['parserfile'] = ["tokenizejavascript.js", "parsejavascript.js"];
	  this.config_['stylesheet'] = 'codemirror/css/jscolors.css';
	} else {
	  this.config_['path']       = 'files/codemirror/';
	  this.config_['stylesheet'] = 'files/codemirror/codemirror.css';
	  this.config_['basefiles']  = 'javascript.js';
	}
  } else if(language == closurekitchen.CodeMirrorTab.Language.HTML) {
	if(closurekitchen.CodeMirrorTab.LOCAL_MODE) {
	  this.config_['path']       = 'codemirror/js/';
	  this.config_['parserfile'] = ["parsexml.js", "parsecss.js", "tokenizejavascript.js",
									"parsejavascript.js", "parsehtmlmixed.js"];
	  this.config_['stylesheet'] = ['codemirror/css/xmlcolors.css',
									'codemirror/css/jscolors.css',
									'codemirror/css/csscolors.css'];
	} else {
	  this.config_['path']       = 'files/codemirror/';
	  this.config_['stylesheet'] = 'files/codemirror/codemirror.css';
	  this.config_['basefiles']  = 'html.js';
	}
  } else {
	goog.fail('Please specify one of closurekitchen.CodeMirrorTab.Language member' +
			  ' as the language argument.');
  }
};
goog.inherits(closurekitchen.CodeMirrorTab, closurekitchen.AbstractEditorTab);

/**
 * Use server or not.
 * @type {boolean}
 * @const
 * @private
 */
closurekitchen.CodeMirrorTab.LOCAL_MODE = location.protocol == 'file:'

/**
 * Programming language identifiers.
 * @enum {string}
 */
closurekitchen.CodeMirrorTab.Language = {
  JAVASCRIPT: 'javascript',
  HTML:       'html'
};

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.CodeMirrorTab.logger_ = goog.debug.Logger.getLogger('closurekitchen.CodeMirrorTab');

/**
 * Configuration parameters.
 * @type {Object}
 * @private
 */
closurekitchen.CodeMirrorTab.prototype.config_;

/**
 * CodeMirror instance.
 * @type {CodeMirror}
 * @private
 */
closurekitchen.CodeMirrorTab.prototype.editor_;

/**
 * The function called after the editor is available.
 * @private
 */
closurekitchen.CodeMirrorTab.prototype.initEditor_ = function() {
  this.editor_.editor.history.commit();
  this.editor_.editor.history.onChange = goog.bind(this.onChange_, this);
};

/**
 * This function is called when ctrl+s is pressed in the editor.
 * @private
 */
closurekitchen.CodeMirrorTab.prototype.onSave_ = function() {
  this.dispatchEvent(new ActionEvent(this, ActionID.SAVE_CURRENT_PROJECT));
};

/**
 * This function is called when the content of the editor is modified.
 * @private
 */
closurekitchen.CodeMirrorTab.prototype.onChange_ = function() {
  this.dispatchEvent(new ActionEvent(this, ActionID.CURRENT_PROJECT_CHANGED));
};

/**
 * Returns the editing text.
 * @return {!string} The editing text.
 */
closurekitchen.CodeMirrorTab.prototype.getCode = function() {
  var code = '';
  try {
	code = this.editor_.getCode() || '';
  } catch(e) {
	closurekitchen.CodeMirrorTab.logger_.severe('Failed to get the editing text.', e);
  }
  return code;
}

/**
 * Set the editing text.
 * @param {string} code The editing text.
 */
closurekitchen.CodeMirrorTab.prototype.setCode = function(code) {
  try {
	var onChange = this.editor_.editor.history.onChange;
	this.editor_.editor.history.onChange = null;
	this.editor_.setCode(code);
	this.editor_.editor.history.commit();
	this.editor_.editor.history.onChange = onChange;
  } catch(e) {
	closurekitchen.CodeMirrorTab.logger_.severe('Failed to set the editing text.', e);
  }
};

/** @inheritDoc */
closurekitchen.CodeMirrorTab.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.editor_ = new CodeMirror(this.getElement(), this.config_);
};

/** @inheritDoc */
closurekitchen.CodeMirrorTab.prototype.showContent = function(flag) {
  goog.base(this, 'showContent', flag);
  flag && this.editor_.editor && this.editor_.focus();
};

/** @inheritDoc */
closurekitchen.CodeMirrorTab.prototype.updateStatusBundle = function(bundle) {
  if(this.editor_.editor) {
	var appStatus   = bundle.getAppStatus();
	var historySize = this.editor_.historySize();
	appStatus.canUndo = historySize['undo'] > 0;
	appStatus.canRedo = historySize['redo'] > 0;
	return new closurekitchen.StatusBundle(appStatus);
  }
  return goog.base(this, 'updateStatusBundle', bundle);
};

/** @inheritDoc */
closurekitchen.CodeMirrorTab.prototype.doAction = function(actionId, opt_data) {
  if(actionId == ActionID.UNDO) {
	this.editor_.editor && this.editor_.undo();
  } else if(actionId == ActionID.REDO) {
	this.editor_.editor && this.editor_.redo();
  } else {
	goog.base(this, 'doAction', actionId, opt_data);
  }
};

});
