/**
* @OnlyCurrentDoc
*/

var token           = "You need to get a token from the BotFather";
var telegramUrl     = "https://api.telegram.org/bot" + token;
var webAppId        = "You need to get this from the Google Apps Script editor after you do a deploy"
var spreadsheetLink = "<URL link to your Spreadsheet here>"
var validUsers = [123456, 123456] // The user ids of the people who can use this bot


function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());  
}

function setWebhook(){
  // Once you do a "deploy" you will be given an id & a URL.  Paste that id in to the "webAppId" string and then choose "Run" selecting the "setWebhook" function.
  // This will poke Telegram to update to the latest URL for this code.
  var webAppUrl = "https://script.google.com/macros/s/" + webAppId + "/exec";
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
}

function sendMessage(id,text){
  var data = {
    'chat_id'    : id,
    'parse_mode' : 'Markdown',
    'text'       : text,
    'disable_web_page_preview' : true
  };

  var options = {
    'method'  : 'post',
    'contentType' : 'application/json',
    'muteHttpExceptions' : true,
    'payload' : JSON.stringify(data)
  };
  
  var url = telegramUrl + "/sendMessage";
  var resp = UrlFetchApp.fetch(url, options);
  console.log(resp.getContentText());
}

function doGet(e){
  // If you point a browser at the webAppURL this will run
  return HtmlService.createHtmlOutput("Hello");
}

function doPost(e){
  var data = JSON.parse(e.postData.contents);
  var text = data.message.text;
  var usersId = data.message.from.id; // The ID of the actual user sending the message
  var chatId = data.message.chat.id; // The ID of the chat, so that replies go to the right place
  var firstName = data.message.from.first_name;
  var validUser = validUsers.indexOf(usersId);
  
  // If you want to debug this in the Google Apps Script editor, comment out the above and use these static vars instead...
  // var firstName = "Will";
  // var text = "/news http://news.com";
  // var usersId = 123456;
  // var validUser = 1;
  // var chatId = "-123456";

  var reply = "Unknown command";
  var command = "";
  var subtext = "";
  
  if (validUser == -1) {
    reply = "Sorry "+firstName+". You're not a valid user of this bot. For reference, your user ID is: `" + usersId + "`";
    sendMessage(chatId, reply);
    return;
  };

  command = text.substr(0,text.indexOf(' '));
  if (command.length==0) {
        command = text;
  } else {
        subtext = text.substr(text.indexOf(' ')+1);
  };

  console.log("Command: " + command);
  console.log("Subtext: " + subtext);
     
  if (command == "/news") {
    if (0 == subtext.indexOf("http")) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheets()[0];
      sheet.appendRow([new Date(),firstName,subtext]);
      reply = "I've added that URL to the spreadsheet."
    } else {
      reply = "Sorry "+firstName+". I don't think that is a URL.";
    }
  } else if (command == "/help") {
    reply = "Commands are:\n`/news` <URL> to add a link to the newsletter spreadsheet.\n`/spreadsheet` shows the spreadsheet URL.";
  } else if (command == "/spreadsheet") {
    reply = "Spreadsheet is [here](" + spreadsheetLink + ")";
  }
  sendMessage(chatId, reply);
}
