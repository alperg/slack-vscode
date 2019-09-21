const vscode = require("vscode");
const request = require("request");
const fs = require('fs');
const disposables = [];
const channelList = [];

let configuration;
let extension;
let token;
let user;
let avatar;
let listChannels;
let listGroups;
let listMembers;

const SLACK_BASE_API_URL = 'https://slack.com/api/';
const ENDPOINT_CHANNELS_LIST = 'channels.list';
const ENDPOINT_USERS_LIST = 'users.list';
const ENDPOINT_GROUPS_LIST = 'groups.list';
const ENDPOINT_POST_MESSAGE = 'chat.postMessage';
const ENDPOINT_FILES_UPLOAD = 'files.upload';

class SlackVSCode {
  constructor() {
    this._statusBarItem;
    this.savedChannel;
  }

  dispose() {
  }
};

let slack;

function cleanupDisposables() {
  while (disposables.length > 0) {
    const DISP = disposables.shift();

    try {
      DISP.dispose();
    }
    catch (e) {
      vscode.window.showErrorMessage('Unknown error.');
    }
  }
}

function reloadConfiguration() {
  cleanupDisposables();
  slack = null;

  const NEW_CONFIG = configuration = vscode.workspace.getConfiguration('slackVSCode');
  const NEW_TOKEN = teamToken = NEW_CONFIG.get('token');

  user = NEW_CONFIG.get('user');
  avatar = NEW_CONFIG.get('avatar');
  listChannels = NEW_CONFIG.get('listChannels');
  listGroups = NEW_CONFIG.get('listGroups');
  listMembers = NEW_CONFIG.get('listMembers');

  if (NEW_TOKEN) {
    disposables.push(slack = new SlackVSCode());
  }
  else {
    vscode.window.showErrorMessage('Please setup a new Slack token to use this extension.');
  }
}

// This function is called when the extension is activated
export function activate(context) {
  extension = context;

  // Commands
  context.subscriptions.push(
    // Send typed message
    vscode.commands.registerCommand('slack.slackSendMsg', () => slack.SendMessage()),
    // Send selected text as a message
    vscode.commands.registerCommand('slack.slackSendSelection', () => slack.SendSelection()),
    // Upload current file
    vscode.commands.registerCommand('slack.slackUploadFileCurrent', () => slack.UploadFileCurrent()),
    // Upload selection
    vscode.commands.registerCommand('slack.slackUploadFileSelection', () => slack.UploadFileSelection()),
    // Upload file path
    vscode.commands.registerCommand('slack.slackUploadFilePath', () => slack.UploadFilePath())
  );

  // Reload configuration when updated
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => reloadConfiguration()),
  );

  reloadConfiguration();
}

// This function is called when the extension is deactivated
export function deactivate() {
  cleanupDisposables();
}
