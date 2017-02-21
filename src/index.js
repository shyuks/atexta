"use strict";
const Alexa = require("alexa-sdk");
const APP_ID = "amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f";
const http = require ('http');
const https = require ('https');
const querystring = require('querystring');

const ATEXTA_STATES = {
  START: "_STARTMODE",
  SECRET: "_SECRETMSGMODE",
  QUICK: "_QUICKMSGMODE",
  CUSTOM: "_CUSTOMMSGMODE",
  HELP: "_HELPMODE"
};

const languageString = {
  "en-US": {
    "translation": {
      "WELCOME_MESSAGE": "Hello, how may I help you? ",
      "WELCOME_REPROMPT": "Tell me a command, or you can ask for help. ",
      "HELP_MESSAGE": "You can send a pre-saved quick message by saying, send quick message. " +
      "Or send a new custom message by saying, send custom message.",
      // "REPEAT_MESSAGE": "To repeat the last question, say, repeat. ",
      // "HELP_REPROMPT": "To give an answer to a question, respond with the number of the answer. ",
      "END_MESSAGE": "Goodbye.",
      "CANCEL_MESSAGE": "Ok, let me know if you change your mind.",
      "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
      // "TRIVIA_UNHANDLED": "Try saying a number between 1 and %s",
      // "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
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
  alexa.registerHandlers(newSessionHandlers, startStateHandlers, secretStateHandlers);
  alexa.execute();
};

const newSessionHandlers = {
  "LaunchRequest": function() {;
    this.handler.state = ATEXTA_STATES.START;
    this.emitWithState("StartRequest");
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
  },
  // "QuickMessage": function() {
  //   this.handler.state = ATEXTA_STATES.QUICK;
  //   this.emitWithState("");
  // },
  // "NewMessage": function() {
  //   this.handler.state = ATEXTA_STATES.VALIDATE;
  //   this.emitWithState("ValidateUser");
  // },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpTheUser");
  },
  "Unhandled": function() {
    let speechOutput = this.t("START_UNHANDLED");
    this.handler.state = ATEXTA_STATES.START
    this.emit(":ask", speechOutput, speechOutput);
  }
};

const startStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.START, {
  
  "StartRequest": function() {
    let accessToken = this.event.session.user.accessToken;
    validateUser(accessToken)
    .then(token => {
      let speechOutput = this.t("WELCOME_MESSAGE");
      let repromptText = this.t("WELCOME_REPROMPT");
      this.emit(":ask", speechOutput, repromptText);
    })
    .catch(reject => {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    })
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
  },
  // "QuickMessageIntent": function() {
  //   this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;             
  //   this.handler.state = ATEXTA_STATES.QUICK;
  //   this.emitWithState("StartQuick");
  // },
  // "CustomMessageIntent": function() {
  //   this.attributes["customMsg"] = this.event.request.intent.slots.NewMessage.value;    
  //   this.handler.state = ATEXTA_STATES.CUSTOM;
  //   this.emitWithState("StartCustom");
  // },
  //Cancel Intent
  //Help Intent
  //Yes Intent
  //Repeat Intent
  //No Intent
  //StartOver Intent
  "SessionEndedRequest": function() {
    console.log("Session ended in start state: " + this.event.request.reason);
  }

});


let secretStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.SECRET, {

  "SendSecretIntent": function() {
    let displayedMsg = this.attributes["secretMsg"];
    let speechOutput = "inside secret intent";
    let cardTitle = "Atexta";
    let cardContent = this.t("SECRET_CARD", displayedMsg);
    //check database for secret message, bring back medium and group
    this.emit(":tellWithCard", speechOutput, cardTitle, cardContent)
    //pending on medium, trigger one of the functionalities to the group
    //if can't find secret message
    // let speechOutput = this.t("SECRET_REPEAT");
    // this.emit(":ask", speechOutput, speechOutput);
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.emit("SendSecretIntent");
  },
  "Amazon.RepeatIntent": function() {
    let speechOutput = this.t("SECRET_REPEAT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  // "Amazon.HelpIntent": function() {
  //   this.handler.state = ATEXTA_STATES.HELP;
  //   this.emitWithState("helpUser", this.attributes["secretMsg"]);
  // },
  "Amazon.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Amazon.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in secret state: " + this.event.request.reason);
  }
});

// let quickMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.QUICKMSG, {

//   "StartQuick": function(quickMsg) {
//     //check database for msg and group
//     //if no group, save msg to attributes and send to recipientintent

//     //if no msg, send error/reprompt

//     //if msg and group exist? send confirmation(yes/no)
//   }

//   //recipientIntent
//     //check for group, find medium, send accordingly, tellwithcard
//     //if no group, reprompt

//   //yes intent
  
//   //no intent

//   //help intent

//   //cancel intent

//   //stop intent
// });

let validateUser = function(accessToken) {
  return new Promise (function(resolve, reject) {
    if (accessToken) {
      resolve(accessToken);
    } else {
      reject();
    }
  })
}