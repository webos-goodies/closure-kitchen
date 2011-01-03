goog.provide('closurekitchen.ActionID');
goog.provide('closurekitchen.ActionType');
goog.provide('closurekitchen.ActionMetaData');
goog.require('closurekitchen.i18n');

/**
 * IDs for user actions.
 * @enum {string}
 */
closurekitchen.ActionID = {
  NEW_PROJECT:             'NEW_PROJECT',
  OPEN_PROJECT:            'OPEN_PROJECT',
  RENAME_PROJECT:          'RENAME_PROJECT',
  DELETE_PROJECT:          'DELETE_PROJECT',
  SAVE_CURRENT_PROJECT:    'SAVE_CURRENT_PROJECT',
  CLONE_CURRENT_PROJECT:   'CLONE_CURRENT_PROJECT',
  RENAME_CURRENT_PROJECT:  'RENAME_CURRENT_PROJECT',
  PUBLISH_CURRENT_PROJECT: 'PUBLISH_CURRENT_PROJECT',
  UNDO:                    'UNDO',
  REDO:                    'REDO',
  UPDATE_PREVIEW:          'UPDATE_PREVIEW',
  CURRENT_PROJECT_CHANGED: 'CURRENT_PROJECT_CHANGED',
  CLEAR_CONSOLE:           'CLEAR_CONSOLE',
  TAB_CHANGED:             'TAB_CHANGED',
  SEARCH:                  'SEARCH',
  FIND_NEXT:               'FIND_NEXT',
  FIND_PREV:               'FIND_PREV'
};

/**
 * Type of action.
 * @enum {string}
 */
closurekitchen.ActionType = {
  ONE_SHOT: 'oneshot',
  TOGGLE:   'toggle',
  SELECT:   'select',
  TEXT:     'text'
};

/**
 * Meta data of action.
 * @type {Object.<closurekitchen.ActionID, Object>}
 * @const
 * @private
 */
closurekitchen.ActionMetaData = {};
closurekitchen.ActionMetaData[closurekitchen.ActionID.NEW_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-new',
  content: goog.getMsg('New Project'),
  tooltip: goog.getMsg('Create a new project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.OPEN_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: goog.getMsg('Open'),
  tooltip: goog.getMsg('Open this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.RENAME_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-rename',
  content: goog.getMsg('Rename'),
  tooltip: goog.getMsg('Change the name of this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.DELETE_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-delete',
  content: goog.getMsg('Delete'),
  tooltip: goog.getMsg('Delete this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.SAVE_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-save',
  content: goog.getMsg('Save'),
  tooltip: goog.getMsg('Save this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.CLONE_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-clone',
  content: goog.getMsg('Clone'),
  tooltip: goog.getMsg('Create a new project with this javascript / html code.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.RENAME_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-rename',
  content: goog.getMsg('Rename'),
  tooltip: goog.getMsg('Change the name of this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.PUBLISH_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: goog.getMsg('Publish'),
  tooltip: goog.getMsg('Publish this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.UNDO] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-undo',
  content: goog.getMsg('Undo'),
  tooltip: goog.getMsg('Undo last action.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.REDO] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-redo',
  content: goog.getMsg('Redo'),
  tooltip: goog.getMsg('Do again the last undone action.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.UPDATE_PREVIEW] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-reload',
  content: goog.getMsg('Reload'),
  tooltip: goog.getMsg('Reload and update preview.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.CLEAR_CONSOLE] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: goog.getMsg('Clear'),
  tooltip: goog.getMsg('Clear debug console.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.SEARCH] = {
  type:    closurekitchen.ActionType.TEXT,
  content: '',
  tooltip: goog.getMsg('Search the editting text or the api reference.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.FIND_NEXT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-down',
  content: goog.getMsg('Find Forward'),
  tooltip: goog.getMsg('Find the text forward.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.FIND_PREV] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-up',
  content: goog.getMsg('Find Backward'),
  tooltip: goog.getMsg('Find the text backward.')
};
