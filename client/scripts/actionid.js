goog.provide('closurekitchen.ActionID');
goog.provide('closurekitchen.ActionType');
goog.provide('closurekitchen.ActionMetaData');

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
  RENAME_CURRENT_PROJECT:  'RENAME_CURRENT_PROJECT',
  PUBLISH_CURRENT_PROJECT: 'PUBLISH_CURRENT_PROJECT',
  UNDO:                    'UNDO',
  REDO:                    'REDO',
  UPDATE_PREVIEW:          'UPDATE_PREVIEW',
  CURRENT_PROJECT_CHANGED: 'CURRENT_PROJECT_CHANGED',
  CLEAR_CONSOLE:           'CLEAR_CONSOLE'
};

/**
 * Type of action.
 * @enum {string}
 */
closurekitchen.ActionType = {
  ONE_SHOT: 'oneshot',
  TOGGLE:   'toggle',
  SELECT:   'select'
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
