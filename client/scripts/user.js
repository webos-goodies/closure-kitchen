goog.provide('closurekitchen.User');

/**
 * User class.
 * @param {closurekitchen.User.Type} type The type of the user.
 * @constructor
 */
closurekitchen.User = function(type) {
  this.type_ = type;
};

/**
 * User types.
 * @enum {string}
 */
closurekitchen.User.Type = {
  GUEST: 'guest',
  USER:  'user',
  ADMIN: 'admin'
};

/**
 * The type of the user.
 * @type {closurekitchen.User.Type}
 * @private
 */
closurekitchen.User.prototype.type_;

/**
 * Returns whether the user has admin privilege.
 * @return true if the user is admin.
 */
closurekitchen.User.prototype.isAdmin = function() {
  return this.type_ == closurekitchen.User.Type.ADMIN;
};

/**
 * Returns whether the user has user privilege.
 * @return true if the user is logged-in.
 */
closurekitchen.User.prototype.isUser = function() {
  return (this.type_ == closurekitchen.User.Type.ADMIN ||
		  this.type_ == closurekitchen.User.Type.USER);
};
