goog.provide('closurekitchen.StatusBundle');
goog.require('goog.object');
goog.require('goog.ui.Component');
goog.require('goog.ui.Control');
goog.require('closurekitchen.ActionID');

goog.scope(function() {
var ActionID = closurekitchen.ActionID;

/**
 * Status bundle class.
 * @param {Object.<string, *>} status Application status.
 * @constructor
 */
closurekitchen.StatusBundle = function(status) {
  this.appStatus_    = goog.object.clone(status);
  this.actionStatus_ = {};
  this.build(status);
};

/**
 * Application status.
 * @type {Object.<string, *>}
 * @private
 */
closurekitchen.StatusBundle.prototype.appStatus_;

/**
 * Status of each action.
 * @type {Object.<closurekitchen.ActionID, Object>}
 * @private
 */
closurekitchen.StatusBundle.prototype.actionStatus_;

/**
 * Set status of the action
 * @param {closurekitchen.ActionID} actionId Action ID to set the status to.
 * @param {boolean} visible true if the action is visible, false otherwise.
 * @param {boolean} enabled true if the action is enabled, false otherwise.
 * @param {*=} opt_data Optional value related the action type.
 *   if the action is ONE_SHOT, this value is ignored.
 *   if the action is TOGGLE, this value is boolean (true means checked).
 *   if the action is SELECT, this value is the selected value.
 * @protected
 */
closurekitchen.StatusBundle.prototype.setActionStatus =
  function(actionId, visible, enabled, opt_data)
{
  var status = { visible: visible, enabled: enabled };
  if(goog.isDef(opt_data))
	status.data = opt_data;
  this.actionStatus_[actionId] = status;
};

/**
 * Build action stattus.
 * @protected
 */
closurekitchen.StatusBundle.prototype.build = function() {
  var isUser    = !!this.appStatus_.isUser;
  var isAdmin   = !!this.appStatus_.isAdmin;
  var isPriv    = !!this.appStatus_.isPriv;
  var isMod     = !!this.appStatus_.isModified;
  var exist     = !!this.appStatus_.exist;
  var canUndo   = !!this.appStatus_.canUndo;
  var canRedo   = !!this.appStatus_.canRedo;
  var canRename = exist && isUser && (isAdmin || isPriv);
  this.setActionStatus(ActionID.NEW_PROJECT,             true,    exist);
  this.setActionStatus(ActionID.OPEN_PROJECT,            true,    exist);
  this.setActionStatus(ActionID.RENAME_PROJECT,          true,    canRename);
  this.setActionStatus(ActionID.DELETE_PROJECT,          isUser,  exist && (isAdmin || isPriv));
  this.setActionStatus(ActionID.SAVE_CURRENT_PROJECT,    true,    exist && isUser && isMod);
  this.setActionStatus(ActionID.RENAME_CURRENT_PROJECT,  isUser,  isUser);
  this.setActionStatus(ActionID.PUBLISH_CURRENT_PROJECT, isAdmin, isAdmin && isPriv);
  this.setActionStatus(ActionID.UNDO,                    true,    canUndo);
  this.setActionStatus(ActionID.REDO,                    true,    canRedo);
  this.setActionStatus(ActionID.UPDATE_PREVIEW,          true,    exist);
};

/**
 * Returns the status of the action.
 * @param {closurekitchen.ActionID} actionId ID of action.
 * @return {Object} The status of the action.
 */
closurekitchen.StatusBundle.prototype.getStatus = function(actionId) {
  return this.actionStatus_[actionId];
};

/**
 * Returns the application status.
 * @return {Object.<string, *>} The application status.
 */
closurekitchen.StatusBundle.prototype.getAppStatus = function() {
  return goog.object.clone(this.appStatus_);
};

/**
 * Update status by StatusBundle.
 * @param {closurekitchen.StatusBundle} bundle StatusBundle object contains action status.
 */
goog.ui.Component.prototype.updateByStatusBundle = function(bundle) {
  this.forEachChild(function(child) {
	if(goog.isFunction(child.updateByStatusBundle))
	  child.updateByStatusBundle(bundle);
  }, this);
};

/**
 * Update status by StatusBundle.
 * @param {closurekitchen.StatusBundle} bundle StatusBundle object contains action status.
 */
goog.ui.Control.prototype.updateByStatusBundle = function(bundle) {
  var model = this.getModel(), meta, status;
  if(model && model.actionId &&
	 (meta   = closurekitchen.ActionMetaData[model.actionId]) &&
	 (status = bundle.getStatus(model.actionId)))
  {
	this.setVisible(status.visible);
	this.setEnabled(status.enabled);
  }
};

});
