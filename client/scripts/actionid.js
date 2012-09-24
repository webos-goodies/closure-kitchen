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
  FIND_PREV:               'FIND_PREV',
  ABOUT:                   'ABOUT'
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
  content: closurekitchen.i18n.getMsg('New Project'),
  tooltip: closurekitchen.i18n.getMsg('Create a new project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.OPEN_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: closurekitchen.i18n.getMsg('Open'),
  tooltip: closurekitchen.i18n.getMsg('Open this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.RENAME_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-rename',
  content: closurekitchen.i18n.getMsg('Rename'),
  tooltip: closurekitchen.i18n.getMsg('Change the name of this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.DELETE_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-delete',
  content: closurekitchen.i18n.getMsg('Delete'),
  tooltip: closurekitchen.i18n.getMsg('Delete this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.SAVE_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-save',
  content: closurekitchen.i18n.getMsg('Save'),
  tooltip: closurekitchen.i18n.getMsg('Save this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.CLONE_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-clone',
  content: closurekitchen.i18n.getMsg('Clone'),
  tooltip: closurekitchen.i18n.getMsg('Create a new project with this javascript / html code.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.RENAME_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-rename',
  content: closurekitchen.i18n.getMsg('Rename'),
  tooltip: closurekitchen.i18n.getMsg('Change the name of this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.PUBLISH_CURRENT_PROJECT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: closurekitchen.i18n.getMsg('Publish'),
  tooltip: closurekitchen.i18n.getMsg('Publish this project.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.UNDO] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-undo',
  content: closurekitchen.i18n.getMsg('Undo'),
  tooltip: closurekitchen.i18n.getMsg('Undo last action.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.REDO] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-redo',
  content: closurekitchen.i18n.getMsg('Redo'),
  tooltip: closurekitchen.i18n.getMsg('Do again the last undone action.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.UPDATE_PREVIEW] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-reload',
  content: closurekitchen.i18n.getMsg('Reload'),
  tooltip: closurekitchen.i18n.getMsg('Reload and update preview.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.CLEAR_CONSOLE] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  content: closurekitchen.i18n.getMsg('Clear'),
  tooltip: closurekitchen.i18n.getMsg('Clear debug console.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.SEARCH] = {
  type:    closurekitchen.ActionType.TEXT,
  content: '',
  tooltip: closurekitchen.i18n.getMsg('Search the editting text or the api reference.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.FIND_NEXT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-down',
  content: closurekitchen.i18n.getMsg('Find Forward'),
  tooltip: closurekitchen.i18n.getMsg('Find the text forward.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.FIND_PREV] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-up',
  content: closurekitchen.i18n.getMsg('Find Backward'),
  tooltip: closurekitchen.i18n.getMsg('Find the text backward.')
};
closurekitchen.ActionMetaData[closurekitchen.ActionID.ABOUT] = {
  type:    closurekitchen.ActionType.ONE_SHOT,
  cls:     'toolbar-icon toolbar-icon-about',
  content: closurekitchen.i18n.getMsg('About'),
  tooltip: closurekitchen.i18n.getMsg('About Closure Kitchen.')
};
