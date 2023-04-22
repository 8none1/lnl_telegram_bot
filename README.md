# Late Night Linux Telegram News Bot

On the [Late Night Linux](https://latenightlinux.com/) podcast we talk about goings on in the Linux and Open Source ecosystem.  To keep ourselves in sync we have a Telegram group where we share links to interesting articles.

Telegram does allow you to see an overview of all links sent to that channel but it's impossible to tell the difference between something we were just commenting on and an article which we think should go in the show.

So we created this Telegram bot to allow us collect interesting links and put them in a spreadsheet where we can review them and more easily copy them over to the show notes.

I didn't want to have to maintain any infrastructure for this bot, so Google Apps Script seemed like a reasonable choice since we already use Google Docs and Google Drive to manage the rest of our shared files.

The script is available in this Github repo.  The file is called `appsscript.gs`.

## Technologies involved

1. Telegram Bot
1. Google Docs
1. Google Apps Scripts

### Telegram

You're going to need to go and see The Botfather and create a new bot.  This [guide](https://core.telegram.org/bots/tutorial) covers most things.
The bot doesn't need to support any commands, we can do that in our script.

The bot should be set up so that it can be added to a group (Allow Groups) and Privacy mode should be `enabled` so that it can't read all your other chat.

The Botfather will give you an API key.  Keep this to hand.

The bot will interact with the Google Docs spreadsheet via a webhook.  That is to say whenever you talk to the bot via a `/` command the bot will receive the text of the message and `POST` it to a webhook URL.  Google Apps Script will host that URL.  We will tell The Botfather about that webhook URL later on.  In the meantime create a group chat and invite the bot.  We need the chat id for that group so we can test.

To get a chat ID I suggest that you:

- Open the Telegram web app in your browser
- Start a new *group* give it a name and add the bot you created earlier (note, there will probably be 100 "googledocstestbot" bots, make sure you select yours.
- Note in the URL bar a negative number at the end of the address, this is the chat ID for your 1:1 conversation with the bot.  Copy this in to the script in the `doPost` function.  NB: include the minus.

### Google Docs

Create a blank Google Docs Spreadsheet.  You can lock this down as much as you want.  The script will run as you, so you don't need to leave it open to the world. 

Inside the Spreadsheet click `Extensions -> Apps Script`.  This will take you to the Apps Script editor which is where the real work begins.

We will scope the script so that it can only talk to the spreadsheet in which it was created.  That is, the script will not have access to the rest of your documents in Google Drive.

### Google Apps Script

Google Apps script is more or less Javascript.  You can write a script and then deploy it as a web app.  This will give you a unique URL which should be kept secret ideally.  You need to tell your Telegram bot about that URL and it will `POST` a JSON object to that URL each time it receives a command (not all messages in the group will be sent to the bot, so it won't snoop on your normal conversations).

I found it extremely frustrating to test and debug this Apps Script.  In order to test you have to deploy it each time which takes a few seconds and a lot of clicking, plus the logging doesn't seem work at all, so you're left with few options to see what's going on.  The best way to debug is to stub out the bits which would be POSTed to you from Telegram and then use the `Run` option at the top of the editor to execute the main `doPOST` function.  That way you do get logs and you don't have to wait to deploy each time.  More on this later.

## The Script itself

We need to declare few things:

- The Telegram bot's authentication token (the Botfather will give you this)
- The id of the deployed Apps Script web app.  More on this below.
- A link to the spreadsheet for convenience purposes (not strictly required)
- A list of Telegram user ids of people who should be allowed to talk to the bot

### Writing a row to the spreadsheet

The script will be scoped to a single spreadsheet, this makes writing a row a little easier.  All you need to do is:

```
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  sheet.appendRow(["An","array","of","cells","to","add"]);
```

this will add a row at the bottom of the first sheet inside the spreadsheet where this script is running.  Each element of the array is a cell in the spreadsheet.

### Telling Telegram where this script lives

Telegram needs to be updated with the live URL of this script.  That URL changes each time you deploy.  There is a convenience function to help you manage this called `setWebhook`.
To get this URL you have to (more on this below):

1. Deploy the script
1. Copy the `deployment id` and update the variable at the top of the script
1. In the Apps Script editor choose the `setWebhook` function and click run
![image](https://user-images.githubusercontent.com/6552931/233774333-d1fe6da3-baeb-497e-976c-40ea05b8273b.png)

This will simply tell Telegram where to POST messages.  You do not need to deploy the script again when you change the `deployment id`, just run the function, but if you do have to redeploy the script the ID will change and you will have to update the script with that id and rerun the `setWebhook` function.

### Sending Telegram messages

We use the JSON object method on the sendMessage Telegram API to send messages.  The `sendMessage` function builds a suitable payload and `POST`s it.

### The main function `doPost`

The `doPost` function is called when Telegram `POST`s a JSON object containing information about the message it received to the webhook URL.  We unpack that object, pick out the relevant information, do some basic sanity checking, add the URL to the spreadsheet and send back a confirmation message.

This is where you need to set some static values if you want to test and debug in the Apps Script editor.  Rather than actually `POST`ing an object we use a local variable instead.

### Testing the function

As mentioned above, testing Apps Scripts of this type is painful.  The best way I found to do it was to replace the data that Telegram would normally POST with hardcoded variables.  This allows you to run a single function from the UI and get logging output and errors.  I've left comments in the code where you can do this.  You will need to change some bits to suit you.  Keep reading for more information on this.

When you run the script for the first time you will be asked to verify a few things.  The process looks like this:

After changing the code to uncomment the test bits. select "doPost" and click "Run".
![image](https://user-images.githubusercontent.com/6552931/233778810-a4ead9df-91ce-413c-957b-a53bfd858f6b.png)

Click "Review Permissions"
![image](https://user-images.githubusercontent.com/6552931/233778833-fe3b7f96-08d6-4b91-a756-05ee2d91b784.png)

Choose your Google account
![image](https://user-images.githubusercontent.com/6552931/233778841-749797f3-56ff-4a38-a75e-6e8ed4092c07.png)

Deal with this massive warning by clicking "Advanced", and then "Go to <your script name"
![image](https://user-images.githubusercontent.com/6552931/233778904-e2f55e12-433c-422d-a265-ad09f9764fe5.png)

Note that the script can only interact with the single spreadsheet you created, plus "connect to an external service" (i.e. POST back to Telegram to send messages):
![image](https://user-images.githubusercontent.com/6552931/233778933-11eb6056-77ae-47ab-8ea8-6fd580e62773.png)

If everything works you should see a message from the bot in the Telegram group you created and a new line in the spreadsheet.  You are now ready to deploy this script, get a webhook URL and hook it up to the bot.  If not, you should at least have some useful logging messages and errors.

## Deploying the script

You now need to comment out all the testing variables and uncomment out the code which gets those values from the POSTed data from Telegram.  Do this and save.
![image](https://user-images.githubusercontent.com/6552931/233779992-a264a8dc-30d0-491e-bcb2-97cfd6a4037c.png)

At the top right you have a "Deploy" button.  Click that and choose "New Deployment".

Then you have to deal with this rather opaque dialogue:
![image](https://user-images.githubusercontent.com/6552931/233779648-5c5e3844-5d54-4e7d-bd65-f57bb6063313.png)

Click the cog next to "Select Type" (yes, it does look like a column header and not a button) and choose "Web App":
![image](https://user-images.githubusercontent.com/6552931/233779681-aaf630ff-1351-4f27-89e0-b92fa159cd56.png)

Fill out the form.  Give it a name, allow it to run as you (it's easier) and allow "Anyone" access:
![image](https://user-images.githubusercontent.com/6552931/233779702-7f28a149-d02a-485c-ab38-0f86e1ce5fcc.png)

Click "Deploy", and you will get back some info.  Copy the "Deployment ID" to the clipboard.

![image](https://user-images.githubusercontent.com/6552931/233779787-e7acb878-e18e-4960-9168-52ddbec4ebda.png)

Take that id and at the top of the script set `webAppId` to be that value.
Save the script (ctrl-s).
At the top from the function dropdown choose `setWebhook` and click run
![image](https://user-images.githubusercontent.com/6552931/233779875-650bf0fd-38a6-4d95-9cde-f6666742a64d.png)

That will tell Telegram where to `POST` it's messages.

Once the script is deployed back in the group chat you posted earlier you should now be able to instruct the bot directly by typing:
`/news <url>`
and after a few seconds the URL should appear in the spreadsheet and you will receive a confirmation message back from the bot.

## Conclusion

Despite its clunkiness when writing a web app Google Apps Script is powerful enough to be able to develop some useful functionality and the Telegram bot API is simple enough to make that easy.  I'll be interested to hear about bots you create in this way.  [Get in touch](https://latenightlinux.com/contact/)
