# VS Code Slack extension
Send your messages and files to Slack without leaving VS Code.
https://marketplace.visualstudio.com/items/alperg

![Screenshot](icon.png)

#### How it works?
* Upload file to Slack

![Send message](upload.gif)

* Send message to Slack

![Upload file](message.gif)

### Installation
You can install this extension by pressing F1 in Visual Studio Code, then typing "ex install" and selecting it from the list.

### Configuration
Go to User Settings (File > Preferences > User Settings) and add the following 
```
  "slackVSCode.token": "<your team token>",
  "slackVSCode.user": "<your username>",
  "slackVSCode.iconUrl": "<your avatar url>",
  "slackVSCode.listChannels": "<`true` for listing the slack channels>",
  "slackVSCode.listGroups": "<`true` for listing the slack groups>",
  "slackVSCode.listMembers": "<`true` for listing the slack members>",
  "slackVSCode.fileWithFullPath": "<`true` if you want to send file with the full path>",
  "slackVSCode.excludeFromFullPath": "<string to exclude from the file full path i.e. `/Users/alper/dev`",
  "slackVSCode.defaultRecipient": "<the default recipient. This will send the message directly. i.e. #general, @user"
```

* ##### `"token"` (required)
    * You can get the token from https://api.slack.com/docs/oauth-test-tokens

* ##### `"user"` (optional)
    * **defaults to "Code"**
    * Specified username will be attributed to each message

* ##### `"iconUrl"` (optional)
    * Image for the avatar, defult 'https://im.ezgif.com/tmp/ezgif-1-0f817186d321.png'

* ##### `"listChannels"` (optional)
    * <`true` for listing the slack channels>

* ##### `"listGroups"` (optional)
    * <`true` for listing the slack groups>

* ##### `"listMembers"` (optional)
    * <`true` for listing the slack members>

* ##### `"fileWithFullPath"` (optional)
    * `true` if you want to send files with full path

* ##### `"excludeFromFullPath"` (optional)
    * String to exclude from the file full path i.e. `/Users/alper/dev`

* ##### `"defaultRecipient"` (optional)
    * The default recipient, to send the message directly without choosing from the drop down. i.e. `#general`, `@user`

### Features
* Send messages to
    * users
    * channels
    * private groups
* Can send message:
    * from selected code
    * from user input
* @user, #channel supported (at the beginning of message)
* Autofill last used channel/user/group
* Upload files
    * current open file
    * enter file path manually
    * selected text in open file
* Specify default recipient
* Limit channels/groups/members

### Shortcuts
* CTRL + ALT + SHIFT + M : Send new message
* CTRL + ALT + SHIFT + S : Send selection
* CTRL + ALT + SHIFT + U : Upload current file

### Feedback / Bug report / feature request
https://github.com/alperg/slack-vscode/issues

   
#### Credits
* Inspired by Sozercan's plugin: https://marketplace.visualstudio.com/items/sozercan.slack

This extension is not created by, affiliated with, or supported by Slack Technologies, Inc.