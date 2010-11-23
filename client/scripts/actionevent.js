goog.provide('closurekitchen.ActionEvent');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

/**
 * An event class for UI actions
 * @constructor
 * @extends {goog.events.Event}
 * @param {Object} target The target of this event.
 * @param {closurekitchen.ActionID} actionId The action id.
 * @param {*=} opt_data The related data of this event.
 */
closurekitchen.ActionEvent = function(target, actionId, opt_data) {
  goog.base(this, closurekitchen.ActionEvent.EVENT_TYPE, target);
  this.actionId = actionId;
  this.data     = opt_data || null;
};
goog.inherits(closurekitchen.ActionEvent, goog.events.Event);

/**
 * The event type of ActionEvent.
 * @type {string}
 * @const
 */
closurekitchen.ActionEvent.EVENT_TYPE = 'closurekitchen_action';

/**
 * Dispatches the action event.
 * @param {goog.events.EventTarget} target The event target.
 * @param {closurekitchen.ActionID} actionId The action id.
 * @param {*=} opt_data The related data of this event.
 */
closurekitchen.ActionEvent.dispatch = function(target, actionId, opt_data) {
  target.dispatchEvent(new closurekitchen.ActionEvent(target, actionId, opt_data));
}

/**
 * The action id of this event.
 * @type {closurekitchen.ActionID}
 */
closurekitchen.ActionEvent.prototype.actionId;

/**
 * The related data of this event.
 * @type {*}
 */
closurekitchen.ActionEvent.prototype.data;
