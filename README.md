# lnl_telegram_bot
On the [Late Night Linux](https://latenightlinux.com/) podcast we talk about goings on in the Linux and Open Source ecosystem.  To keep ourselves in sync we have a Telegram group where we share links to interesting articles.

Telegram does allow you to see an overview of all links sent to that channel but it's impossible to tell the difference between something we were just commenting on and an article which we think should go in the show.

So we created this Telegram bot to allow us collect interesting links and put them in a spreadsheet where we can review them and more easily copy them over to the show notes.

## Technologies involved

1. Telegram Bot
1. Google Docs
1. Google Apps Scripts

### Telegram

You're going to need to go an see The Botfather and create a new bot.  This [guide](https://core.telegram.org/bots/tutorial) covers most things.
The bot doesn't need to support any commands, we can do that in our script.

The bot should be set up so that it can be added to a group (Allow Groups) and Privacy mode should be `enabled` so that it can't read all your other chat.

The Botfather will give you an API key.  Keep this safe.

The bot itself will interact with the Google Docs spreadsheet via a webhook.  That is to say whenever you talk to the bot or use a `/` command the bot will receive the text of the message and `POST` it to a webhook URL.

### Google Docs

Create a blank Google Docs Spreadsheet.  You can lock this down as much as you want.  The script will run as you, so you don't need to leave it open to the world. 

Inside the Spreadsheet click `Extensions -> Apps Script`.  This will take you to the Apps Script editor which is where the real work begins.

We will scope the script so that it can only talk to the spreadsheet in which it was created.  That is, the script will not have access to the rest of your documents in Google Drive.

### Google Apps Script

Google Apps script is more or less Javascript.  You can write a script and then deploy it as a web app.  This will give you a unique URL which should be kept secret ideally.  You need to tell your Telegram bot about that URL and it will `POST` a JSON object to that URL each time it receives a message (not all messages in the group will be sent to the bot, so it won't snoop on your normal conversations).

I found it extremely frustraiting to test and debug this Apps Script.  In order to test in the real work you have to deploy it each time which takes a few seconds and a lot of clicking, plus the logging doesn't seem work at all, so you're left with few options to see what's going on.  The best way to debug is to mock out the bits which would be POSTed to you from Telegram and then use the `Run` option at the top of the editor to execute the main `doPOST` function.  That way you do get logs and you don't have to wait to deploy each time.  More on this later.

## The Script itself

We need to declare few things:
- The Telegram bot's authentication token (the Botfather will give you this)
- The id of the deployed Apps Script web app.  See below.
- A link to the spreadsheet for convinience purposes (not strictly required)
- A list of Telegram user ids of people who should be allowed to talk to the bot

### Wrtiting a row to the spreadsheet

The script will be scoped to a single spreadsheet, this makes writing a row a little easier.  All you need to do is:

```
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  sheet.appendRow(["An","array","of","cells","to","add"]);
```

this will add a row at the bottom of the first sheet inside the spreadsheet where this script is running.

### Telling Telegram where this script lives
Telegram needs to be updated with the live URL of this script.  That URL changes each time you redploy.  There is a convinence function to help you manage this called `setWebhook`.

1. Deploy the script
1. Copy the `deployment id` and update the variable at the top of the script
1. In the Apps Script editor choose the `setWebhook` function and click run
![image](https://user-images.githubusercontent.com/6552931/233774333-d1fe6da3-baeb-497e-976c-40ea05b8273b.png)

This will simply tell Telegram where to POST it's messages.  You do not need to deploy the script again when you change the `deployment id`, just run the function.

### Sending Telegram messages
We use the JSON object method on the sendMessage Telegram API to send messages.  This function builds a suitable payload and `POST`s it.


### The main function `doPost`
The `doPost` function is called when Telegram `POST`s a JSON object containing information about the message it received.  We unpack that object, pick out the relevant information, do some basic santiy checking, add the URL to the spreadsheet and send back a confirmation message.

This is where you need to set some static values if you want to test and debug in the Apps Script editor.  Rather than actually `POST`ing an object we use a local variable instead.

