goog.provide('closurekitchen.i18n');
goog.provide('closurekitchen.i18n.msg.en_US');
goog.provide('closurekitchen.i18n.msg.ja_JP');

/**
 * Message catalog in english.
 * @type {Object.<string,string>}
 */
closurekitchen.i18n.msg.en_US = {};

/**
 * Message catalog in japanese.
 * @type {Object.<string,string>}
 */
closurekitchen.i18n.msg.ja_JP = {
  // Tab labels.
  'JavaScriut':    'JavaScript',
  'HTML':          'HTML',
  'Preview':       'プレビュー',
  'Reference':     'リファレンス',

  // Meta data of actions.
  'New Project':                      '新規プロジェクト',
  'Create a new project.':            '新規プロジェクトを作成する。',
  'Open':                             '開く',
  'Open this project.':               'プロジェクトを開く。',
  'Rename':                           '名前変更',
  'Change the name of this project.': 'このプロジェクトの名前を変更する。',
  'Delete':                           '削除',
  'Delete this project.':             'このプロジェクトを削除する。',
  'Save':                             '保存',
  'Save this project.':               'このプロジェクトを保存する。',
  'Clone':                            '複製',
  'Create a new project with this javascript / html code.':
      'このプロジェクトのjavascript/htmlコードを使用して新規プロジェクトを作成する。',
  'Publish':                          '公開',
  'Publish this project.':            'このプロジェクトを公開する。',
  'Undo':                             '取消',
  'Undo last action.':                '最後の操作を取り消す',
  'Redo':                             '再実行',
  'Do again the last undone action.': '最後に取消した操作を再度実行する',
  'Reload':                           '再読込',
  'Reload and update preview.':       'プレビューの内容を更新する。',
  'Clear':                            'クリア',
  'Clear debug console.':             'デバッグコンソールの内容をクリアする。',
  'Find Forward':                     '前方検索',
  'Find the text forward.':           'テキストを前方検索する。',
  'Find Backward':                    '後方検索',
  'Find the text backward.':          'テキストを後方検索する。',
  'About':                            '情報',
  'About Closure Kitchen':            'Closure Kitchen について',

  // Tree view.
  'Private projects': '個人のプロジェクト',
  'Sample projects':  'サンプル',

  // Rename dialog.
  'Project name':                       'プロジェクト名',
  'Please input the new project name.': 'プロジェクト名を入力してください。',

  // miscellaneous...
  'New project':              '新規プロジェクト',
  'Tutorial':                 'チュートリアル',
  'Failed to load "{$name}"': '"{$name}"の読み込みに失敗しました。',
  'The curent project is modified.\nDiscard anyway?': 'プロジェクトの変更を破棄しますか？',
  'Are you sure to delete {$name}?': '{$name} を削除してよろしいですか？',
  'You can watch the tutorial anytime by clicking the "Tutorial" link above.':
	'再度チュートリアルを見たいときは、ページ上部の「チュートリアル」をクリックしてください。'
};

/**
 * Message catalog in the current language.
 * @type {Object.<string,string>}
 */
closurekitchen.i18n.msg.current;

if(goog.LOCALE == 'ja' || true) {
  closurekitchen.i18n.msg.current = closurekitchen.i18n.msg.ja_JP;
} else {
  closurekitchen.i18n.msg.current = closurekitchen.i18n.msg.en_US;
}

/**
 * Implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
closurekitchen.i18n.getMsg = function(str, opt_values) {
  str = closurekitchen.i18n.msg.current[str] || str;
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};
