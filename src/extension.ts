import * as vscode from 'vscode';
import * as request from 'request';
const fs = require('fs');

let disposables: vscode.Disposable[] = [];
const channelList = [];
let token: string;
let listChannels: boolean;
let listGroups: boolean;
let listMembers: boolean;
let fileWithFullPath: boolean;
let excludeFromFullPath: string;
let defaultRecipient: string;

const SLACK_BASE_API_URL = 'https://slack.com/api/';
const ENDPOINT_CHANNELS_LIST = 'conversations.list';
const ENDPOINT_USERS_LIST = 'users.list';
const ENDPOINT_GROUPS_LIST = 'groups.list';
const ENDPOINT_POST_MESSAGE = 'chat.postMessage';
const ENDPOINT_FILES_UPLOAD = 'files.upload';

class SlackVSCode {
  private savedChannel: string;

  private GetChannelList(callback, type, data) {
    const params = `?token=${token}&exclude_archived=1`;
    channelList.length = 0;

    const wrapRequest = function (urls, callback) {
      let results = {};
      let t = urls.length;
      let c = 0;

      const handler = function (error, response, body) {
        const url = response.request.uri.href;

        results[url] = { error, response, body };

        if (++c === urls.length) {
          callback(results);
        }
      };

      while (t--) {
        request(urls[t], handler);
      }
    };

    const urls = [
      `${SLACK_BASE_API_URL}${ENDPOINT_CHANNELS_LIST}${params}`,
      `${SLACK_BASE_API_URL}${ENDPOINT_GROUPS_LIST}${params}`,
      `${SLACK_BASE_API_URL}${ENDPOINT_USERS_LIST}${params}`
    ];

    wrapRequest(urls, function (responses) {
      let response;

      for (let url in responses) {
        // reference to the response object
        response = responses[url];

        // find errors
        if (response.error) {
          vscode.window.showErrorMessage(`Error in Slack communication: ${url}:${response.error}`);
          return;
        }

        // render body
        if (response.body) {
          let r = JSON.parse(response.body);

          if (r.channels && listChannels) {
            for (let i = 0; i < r.channels.length; i++) {
              let c = r.channels[i];
              channelList.push({ id: c.id, label: `#${c.name}` });
            }
          }

          if (r.groups) {
            for (let i = 0; i < r.groups.length; i++) {
              let c = r.groups[i];
              if (listGroups && !c.name.startsWith('mpdm')) {
                channelList.push({ id: c.id, label: `#${c.name}`, description: c.topic.value });
              }
            }
          }

          if (r.members && listMembers) {
            for (let i = 0; i < r.members.length; i++) {
              let c = r.members[i];
              channelList.push({ id: c.id, label: `@${c.name}`, description: c.profile.real_name });
            }
          }
        }
      }

      callback && callback(type, data);
    });
  }

  private ApiCall(apiType, data?) {
    request.post({
      url: `${SLACK_BASE_API_URL}${apiType}`,
      formData: data
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        switch (apiType) {
          case ENDPOINT_FILES_UPLOAD:
            vscode.window.showInformationMessage('File sent successfully!');
            break;
          default:
            vscode.window.showInformationMessage('Message sent successfully!');
            break;
        }
      }
    });
  }

  private QuickPick() {
    const channels = channelList.filter(c => c.label.startsWith('#'));
    const members = channelList.filter(c => c.label.startsWith('@'));
    channels.sort((a, b) => (a.label > b.label) ? 1 : -1);
    members.sort((a, b) => (a.label > b.label) ? 1 : -1);
    return vscode.window.showQuickPick([...channels, ...members], { matchOnDescription: true, placeHolder: 'Select a member / group / channel' });
  }

  private Send(type, data) {
    const sendMsg = function (type, data) {
      if (data) {
        const s = new SlackVSCode();
        s.ApiCall(type, data);
      }
    }

    if (defaultRecipient && defaultRecipient !== '') {
      const recipient = channelList.filter(c => c.label === defaultRecipient)[0];
      if (recipient) {
        data.channel = recipient.id;
        data.channels = recipient.id;
      }
    }

    // sending a message to a specified channel/user/group
    if (data.channel) {
      sendMsg(type, data);
    }
    else {
      const slack = new SlackVSCode;
      const pick = slack.QuickPick();

      pick.then(item => {
        if (item) {
          data.channels = item.id;
          data.channel = item.id;
          sendMsg(type, data);
        }
      });
    }
  }

  // Upload file from path
  public UploadFilePath() {
    const options = {
      prompt: 'Please enter a path'
    };

    vscode.window.showInputBox(options).then(path => {
      if (path) {
        const data = {
          channels: '',
          token: token,
          file: fs.createReadStream(path)
        };

        this.GetChannelList(this.Send, ENDPOINT_FILES_UPLOAD, data);
      }
    });
  }

  // Upload current file
  public UploadCurrentFile() {
    const document = vscode.window.activeTextEditor.document.getText();
    this.Upload(document);
  }

  // Upload selection as file
  public UploadFileSelection() {
    const document = vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection);
    this.Upload(document);
  }

  public Upload(document) {
    const data: any = {
      channels: '',
      token: token,
      content: document
    };

    if (vscode.window.activeTextEditor.document.isUntitled) {
      const options = { prompt: 'Please enter a file extension' };

      vscode.window.showInputBox(options).then(type => {
        data.filetype = type;
        this.GetChannelList(this.Send, ENDPOINT_FILES_UPLOAD, data);
      });
    } else {
      const filename_with_path = vscode.window.activeTextEditor.document.fileName;
      let filename;

      if (fileWithFullPath) {
        filename = filename_with_path.substring(filename_with_path.lastIndexOf('\\') + 1);
        if (excludeFromFullPath && excludeFromFullPath !== '') {
          filename = filename.split(excludeFromFullPath).pop();
        }
        data.title = filename;
      } else {
        filename = filename_with_path.substring(filename_with_path.lastIndexOf('/') + 1);
      }

      data.filename = filename;

      this.GetChannelList(this.Send, ENDPOINT_FILES_UPLOAD, data);
    }
  }

  public SendMessage() {
    const options = {
      prompt: 'Please enter a message',
      value: this.savedChannel
    };

    vscode.window.showInputBox(options).then(text => {
      if (text) {
        const data = {
          channel: '',
          token: token,
          text: text
        };

        if (text.startsWith('@') || text.startsWith('#')) {
          data.channel = text.substr(0, text.indexOf(' '));
          this.savedChannel = `${data.channel} `;  // remember last used channel
          data.text = text.substr(text.indexOf(' ') + 1);
        }
        else {
          this.savedChannel = ''; // clear saved channel
        }

        this.GetChannelList(this.Send, ENDPOINT_POST_MESSAGE, data);
      }
    });
  };

  public SendSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    const selection = editor.selection;
    const text = '```' + editor.document.getText(selection) + '```';

    const data = {
      channel: '',
      token: token,
      text: text
    };

    this.GetChannelList(this.Send, ENDPOINT_POST_MESSAGE, data);
  }

  dispose() {
  }
};

let slack: SlackVSCode;

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

  const CONFIG: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('slackVSCode');
  const TOKEN = token = CONFIG.get('token');

  listChannels = CONFIG.get('listChannels');
  listGroups = CONFIG.get('listGroups');
  listMembers = CONFIG.get('listMembers');
  fileWithFullPath = CONFIG.get('fileWithFullPath');
  excludeFromFullPath = CONFIG.get('excludeFromFullPath');
  defaultRecipient = CONFIG.get('defaultRecipient');

  if (TOKEN) {
    disposables.push(slack = new SlackVSCode());
  }
  else {
    vscode.window.showErrorMessage('Please setup a new Slack token to use this extension.');
  }
}

// This function is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Commands
  context.subscriptions.push(
    // Send typed message
    vscode.commands.registerCommand('slackVSCode.sendMessage', () => slack.SendMessage()),
    // Send selected text as a message
    vscode.commands.registerCommand('slackVSCode.sendSelection', () => slack.SendSelection()),
    // Upload current file
    vscode.commands.registerCommand('slackVSCode.uploadCurrentFile', () => slack.UploadCurrentFile()),
    // Upload selection
    vscode.commands.registerCommand('slackVSCode.uploadFileSelection', () => slack.UploadFileSelection()),
    // Upload file path
    vscode.commands.registerCommand('slackVSCode.uploadFilePath', () => slack.UploadFilePath())
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
