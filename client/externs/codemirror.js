/**
 * Default configuration options.
 * @type {Object.<string,string>}
 */
var CodeMirrorConfig = {};

/**
 * CodeMirror class.
 * @constructor
 * @param {!Element} element The parent element of the editor.
 * @param {Object.<string,string>=} opt_config The configuration optoins.
 */
var CodeMirror = function(element, opt_config) {};

/**
 * The editable frame.
 * @type {Element}
 */
CodeMirror.prototype.frame;

/**
 * The window of the editable frame. Mostly useful for attaching event handlers.
 * @type {Window}
 */
CodeMirror.prototype.win;

/**
 * The DIV element wrapped around the frame. This always has a CSS class of CodeMirror-wrapping.
 * @type {Element}
 */
CodeMirror.prototype.wrapping;

/**
 * Returns the current content of the editor, as a string.
 * @return {string} The current content of the editor
 */
CodeMirror.prototype.getCode = function() {};

/**
 * Replaces the current content of the editor with the given value.
 * @param {string} str
 */
CodeMirror.prototype.setCode = function(str) {};

/**
 * Gives focus to the editor frame.
 */
CodeMirror.prototype.focus = function() {};

/**
 * Returns the text that is currently selected in the editor.
 * @returns {string} Selected text.
 */
CodeMirror.prototype.selection = function() {};

/**
 * Replaces the currently selected text with the given string.
 * Will also cause the editor frame to gain focus.
 * @param {string} str The new string.
 */
CodeMirror.prototype.replaceSelection = function() {};

/**
 * Automatically re-indent the whole document.
 */
CodeMirror.prototype.reindent = function() {};

/**
 * Automatically re-indent the selected lines.
 */
CodeMirror.prototype.reindentSelection = function() {};

/**
 * The first argument provides the string that should be searched for.
 * The second determines where to start searching. It can be false (or
 * left off) for the start of the document, true for the current cursor
 * position, or a {line, character} object (as returned by cursorPosition,
 * or created yourself using a line handle and a number) to set a random
 * position. The third argument, a boolean, determines whether the search
 * will be case-sensitive. If it is not provided, the search will only
 * be case-sensitive if the search string contains uppercase characters.
 * Returns an object that provides an interface for searching. Call its
 * findNext() and findPrevious() methods to search for an occurrence.
 * This returns true if something is found, or false if the end or start
 * of the document was reached. When an occurrence has been found, you
 * can call select() to select it, or replace(string) to replace it with
 * a given string. To find out where the match was found, call the position()
 * method, which returns a {line, character} object. Note that letting
 * the user change the document, or programmatically changing it in any
 * way except for calling replace on the cursor itself, might cause a
 * cursor object to skip back to the beginning of the document.
 * @param {string} str The string that should be searched for.
 * @param {boolean|Object} startPos starting position.
 * @param {boolean=} opt_caseFold The search will be case-sensitive or not.
 * @returns {Object} An object that provides an interface for searching
 */
CodeMirror.prototype.getSearchCursor = function(str, startPos, opt_caseFold) {};

/**
 * Undo one changeset, if available.
 */
CodeMirror.prototype.undo = function() {};

/**
 * Redo one changeset, if available.
 */
CodeMirror.prototype.redo = function() {};

/**
 * Get a {undo, redo} object holding the sizes of the undo and redo histories.
 * @returns {Object}
 */
CodeMirror.prototype.historySize = function() {};

/**
 * Drop all history information.
 */
CodeMirror.prototype.clearHistory = function() {};

/**
 * Route keyboard input in the editor to a callback function. This function
 * is given a slightly normalised (see normalizeEvent in util.js) keydown
 * event object. If a second argument is given, this will be used to
 * determine which events to apply the callback to. It should take a key
 * code (as in event.keyCode), and return a boolean, where true means the
 * event should be routed to the callback, and false leaves the key to
 * perform its normal behaviour.
 * @param {Function} callback The callback function.
 * @param {Function=} opt_filter The filter function.
 */
CodeMirror.prototype.grabKeys = function(callback, opt_filter) {};

/**
 * Revert the effect of grabKeys.
 */
CodeMirror.prototype.ungrabKeys = function() {};

/**
 * Change the active parser. To use this you'll have to load more than
 * one parser (put the one you want to use as default at the end of the
 * list). Then call this function with a string containing the name of
 * the parser you want to switch to (see the parser script file to find
 * the name, it'll be something like CSSParser). The second argument is
 * optional, and can be used to pass a new parser configuration object.
 * @param {string} name The name of parser.
 * @param {Object=} parserConfig The configuration parameters of parser.
 */
CodeMirror.prototype.setParser = function(name, parserConfig) {};

/**
 * Get the coordinates of the cursor in the editor, relative to the top-
 * left corner of the outer document. Normally returns an object with
 * x, y, and yBot (the bottom of the cursor) properties. May return null
 * if the cursor position could not be determined (for example, if the
 * editor is not focused).
 * @param {*} start
 */
CodeMirror.prototype.cursorCoords = function(start) {};
