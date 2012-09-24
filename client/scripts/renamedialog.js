goog.provide('closurekitchen.RenameDialog');
goog.require('goog.dom.DomHelper');
goog.require('goog.ui.Prompt');
goog.require('goog.debug.Logger');
goog.require('closurekitchen.i18n');
goog.require('closurekitchen.Project');

goog.scope(function() {
var Prompt = goog.ui.Prompt;

/**
 * Prompt dialog for a project name.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional dom helper.
 * @constructor
 * @extends {goog.ui.Prompt}
 */
closurekitchen.RenameDialog = function(opt_domHelper) {
  goog.base(
	this,
	closurekitchen.i18n.getMsg('Project name'),
	closurekitchen.i18n.getMsg('Please input the new project name.'),
	goog.bind(this.onDialogClose_, this),
	'', null, false, opt_domHelper);
  this.project_      = null;
  this.userCallback_ = null;
};
goog.inherits(closurekitchen.RenameDialog, goog.ui.Prompt);

/**
 * The project to be renamed.
 * @type {closurekitchen.Project}
 * @private
 */
closurekitchen.RenameDialog.prototype.project_;

/**
 * The defalut value of the input field.
 * @type {?string}
 * @private
 */
closurekitchen.RenameDialog.prototype.defalutValue_;

/**
 * The callback function called when the project name is changed.
 * @type {Function}
 * @private
 */
closurekitchen.RenameDialog.prototype.userCallback_;

/**
 * this object for userCallback_.
 * @type {Object}
 * @private
 */
closurekitchen.RenameDialog.prototype.userScope_;

/**
 * The logger for this class.
 * @type { goog.debug.Logger }
 * @private
 */
closurekitchen.RenameDialog.logger_ = goog.debug.Logger.getLogger('closurekitchen.RenameDialog');

/**
 * Open this dialog.
 * @param {closurekitchen.Project} project The project to be renamed.
 * @param {string} defaultValue The default value of the input field.
 * @param {Function=} opt_callback The callback function called when the project name is changed.
 * @param {Object=} opt_scope this object for opt_callback.
 */
closurekitchen.RenameDialog.prototype.openDialog =
	function(project, defaultValue, opt_callback, opt_scope)
{
  if(this.project_ || this.isVisible()) {
	closurekitchen.RenameDialog.logger_.severe('The rename dialog is in use.');
	return;
  }

  this.project_      = project;
  this.defaultValue_ = defaultValue;
  this.userCallback_ = opt_callback;
  this.userScope_    = opt_scope;

  this.setDefaultValue(this.defaultValue_);
  this.setVisible(true);
};

/**
 * This function is called when this dialog is closed.
 * @param {?string} text The user entered text.
 * @private
 */
closurekitchen.RenameDialog.prototype.onDialogClose_ = function(text) {
  if(text && this.defalutValue_ != text) {
	try {
	  if(this.userCallback_) {
		this.userCallback_.call(this.userScope_ || window, this.project_, text);
	  }
	} catch(e) {
	  closurekitchen.RenameDialog.logger_.severe(
		'User callback throws the exception.', e);
	}
  }
  this.project_      = null;
  this.defalutValue_ = null;
  this.userCallback_ = null;
  this.userScope_    = null;
};

});
