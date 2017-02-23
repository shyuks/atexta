"use strict";
const Alexa = require("alexa-sdk");
const APP_ID = "amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f";
const dbHandler = require('./db/controllers/db_controllers')
const text = require('./apiComm/controllers/twilio_controllers')
const email = require('./apiComm/controllers/email_controllers')

const ATEXTA_STATES = {
  START: "_STARTMODE",
  QUICK: "_QUICKMSGMODE",
  CUSTOM: "_CUSTOMMSGMODE",
  SECRET: "_SECRETMSGMODE",
  HELP: "_HELPMODE"
};

const languageString = {
  "en-US": {
    "translation": {
      "LAUNCH_MESSAGE": "Hello, how may I help you? ",
      "LAUNCH_REPROMPT": "Tell me a command, or you can ask for help. ",
      "HELP_MESSAGE": "You can send a pre-saved quick message by saying, send quick message. " +
        "Or send a new custom message by saying, send custom message.",
      "NEW_USER": "It looks as though you haven\'t customized your settings yet. " + 
        "Please download the app or visit myatexta.com to utilize this skill. ",
      "NEW_USERCARD": "Please download the Atexta app or visit www.myatexta.com to customize your messages.",
      "QUICK_ERROR": "Sorry, I couldn\'t find that pre-saved message. " +
        "What quick message would you like to send? ",
      "SELECT_GROUP": "Who would you like to send this to? ",
      "END_MESSAGE": "Goodbye.",
      "CANCEL_MESSAGE": "Ok, let me know if you change your mind.",
      "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
      "START_UNHANDLED": "Message unhandled. Sorry, I didn\'t get that. What would you like to do? ",
      "LINK_ACCOUNT": "It seems as though your account isn't linked yet. " + 
        "Please open your Amazon Alexa app and sign into atexta. ",
      "SECRET_CONFIRM": "confirm secret here",
      "SECRET_CARD": "%s has been sent.",
      "SECRET_REPEAT": "Sorry, I didn\'t get that. Please repeat your command. "
    }
  }
}

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.resources = languageString;
  alexa.registerHandlers(
    newSessionHandlers, 
    quickMsgStateHandlers, 
    customMsgStateHandlers,
    secretStateHandlers,
    helpStateHandlers);
  alexa.execute();
};

let newSessionHandlers = {
  "LaunchRequest": function() {;
    this.attributes["token"] = this.event.session.user.accessToken;
    if (this.attributes["token"]) {
      let speechOutput = this.t("WELCOME_MESSAGE");
      let repromptText = this.t("WELCOME_REPROMPT");
      this.emit(":ask", speechOutput, repromptText);
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "QuickIntent": function() {
    this.attributes["token"] = this.event.session.user.accessToken;
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.handler.state = ATEXTA_STATES.QUICK;
    this.emitWithState("SendQuickIntent");
  },
  "CustomIntent": function() {
    this.attributes["token"] = this.event.session.user.accessToken;
    this.attributes["customMsg"] = this.event.request.intent.slots.CustomMessage.value;    
    this.handler.state = ATEXTA_STATES.CUSTOM;
    this.emitWithState("SendCustomIntent");
  },
  "SecretIntent": function() {
    this.attributes["token"] = this.event.session.user.accessToken;
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
  },
  "Amazon.RepeatIntent": function() {
    let speechOutput = this.t("LAUNCH_REPROMPT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "Amazon.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Amazon.CancelIntent": function() {
    this.emit("StopIntent");
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", false);
  },
  "Unhandled": function() {
    let speechOutput = this.t("START_UNHANDLED");
    this.handler.state = ATEXTA_STATES.START
    this.emit(":ask", speechOutput, speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in new session state: " + this.event.request.reason);
  }
};

let quickMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.QUICK, {
  "SendQuickIntent": function() {
    if (this.attributes["token"]) {
      dbHandler.getIntentInfo(this.attributes["token"], this.attributes["quickMsg"])
      .then(results => {
        if (results.newUser) {
          let speechOutput = this.t("NEW_USER");
          let cardTitle = "Atexta";
          let cardContent = this.t("NEW_USERCARD");
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        } else if (!results.command) {
          let speechOutput = this.t("QUICK_ERROR")
          this.emit(":ask", speechOutput);
        } else if (!results.group) {
          this.attributes["messageContent"] = results.data;
          let speechOutput = this.t("SELECT_GROUP");
          this.emit(":ask", speechOutput);
        } else {
          if (results.data[0].mediumType === "T") {
            //send twilio
            results.forEach(recipient => {
            text.sendText(recipient.contactInfo, recipient.text);
            })
          } else if (results.data[0].mediumType === "E") {
            //send email
            results.forEach(recipient => {
            email.sendEmail(recipient.contactInfo, recipient.text);
            })
          } else {
            //send slack
          }
        }
      })
      .catch(error => {
        this.emit(":tell", "catch error in send quick intent");
      })
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "QuickIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.emit("SendQuickIntent");
  },
  "RecipientIntent": function() {
    let group = this.event.request.intent.slots.Group.value;
      
      //check for group, find medium, send accordingly, tellwithcard
      //if no group, reprompt
  },
  "Amazon.RepeatIntent": function() {
    let speechOutput = this.t("")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "Amazon.HelpIntent": function() {
    let secretMsg = this.attributes["secretMsg"];
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", secretMsg);
  },
  "Amazon.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Amazon.CancelIntent": function() {
    this.emit("StopIntent");
  },
  
  //yes intent
  
  //no intent

  //help intent

  //cancel intent

  //stop intent
});

let secretStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.SECRET, {
  "SendSecretIntent": function(token) {
    if (token) {
      let secretMsg = this.attributes["secretMsg"];
      let speechOutput = "inside secret intent";
      let cardTitle = "Atexta";
      let cardContent = this.t("SECRET_CARD", secretMsg);
        // dbHandler.getIntentInfo(token, secretMsg)
        // .then(result => {
        //   if (result.newUser) {
        //     let speechOutput = 
        //     this.emit(":tellWithCard", )
        //   }
        // })
      this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
    //check database for secret message, bring back medium and group
    //pending on medium, trigger one of the functionalities to the group
    //if can't find secret message
    // let speechOutput = this.t("SECRET_REPEAT");
    // this.emit(":ask", speechOutput, speechOutput);
  },
  "Amazon.RepeatIntent": function() {
    let speechOutput = this.t("SECRET_REPEAT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "Amazon.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", true);
  },
  "Amazon.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Amazon.CancelIntent": function() {
    this.emit("StopIntent");
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in secret state: " + this.event.request.reason);
  }
});