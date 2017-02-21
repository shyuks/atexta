"use strict";
const Alexa = require("alexa-sdk");
const APP_ID = "amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f";
const http = require ('http');
const https = require ('https');
const querystring = require('querystring');

const ATEXTA_STATES = {
  VALIDATE: "_VALIDATEMODE",
  START: "_STARTMODE",
  SECRET: "_SECRETMODE",
  QUICKMSG: "_QUICKMESSAGEMODE",
  NEWMSG: "_NEWMESSAGEMODE",
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
      // "STOP_MESSAGE": "Would you like to keep playing?",
      "CANCEL_MESSAGE": "Ok, let me know if you change your mind.",
      "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
      // "TRIVIA_UNHANDLED": "Try saying a number between 1 and %s",
      // "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
      "START_UNHANDLED": "Message unhandled. Sorry, I didn\'t get that. What would you like to do? ",
      "LINK_ACCOUNT": "It seems as though your account isn't linked yet. " + 
      "Please open your Amazon Alexa app and sign into Atexta. ",
      "SECRET_CONFIRM" : "%s has been sent. ",
      "SECRET_ERROR" : "Hmm, I didn\'t get that, can you please repeat yourself? "
    }
  }
}

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.resources = languageString;
  alexa.registerHandlers(newSessionHandlers, startStateHandlers, secretMsgStateHandlers);
  alexa.execute();
};

const newSessionHandlers = {

  "LaunchRequest": function() {;
    this.handler.state = ATEXTA_STATES.VALIDATE;
    this.emitWithState("ValidateUser");
  },
  "SecretIntent": function() {
    this.handler.state = ATEXTA_STATES.VALIDATE;
    this.emit(":tell", "now in secret intent state of new session handlers");
    // this.emitWithState("ValidateSecret");
  },
  // "QuickMessage": function() {
  //   this.handler.state = ATEXTA_STATES.VALIDATE;

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

// const validateStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.VALIDATE, {
  
//   "ValidateUser": function() {
//     let accessToken = this.event.session.user.accessToken;             
//     if (accessToken) {
//       // getUserInfo(accessToken)
//       // .then(result => {
//       //   this.attributes['userEmail'] = result;
//         this.handler.state = ATEXTA_STATES.START;
//         this.emit(":tell", "now in the validate user in validation state");
//         // this.emitWithState("StartRequest");
//       // })
//       // .catch(error => {
//       //   this.emit(":tell", "Error in getting user info. ");
//       // })
//     } else {
//       let speechOutput = this.t("LINK_ACCOUNT");
//       this.emit(":tellWithLinkAccountCard", speechOutput)
//     }
//   },

//   "SessionEndedRequest": function() {
//         console.log("Session ended in validate state: " + this.event.request.reason);
//     }
// });

const startStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.START, {
  
  "StartRequest": function() {
    let speechOutput = this.t("WELCOME_MESSAGE");
    let repromptText = this.t("WELCOME_REPROMPT");
    this.emit(":ask", speechOutput, repromptText);
  },
  "SecretIntent": function() {
    let secretMsg = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecret", secretMsg);
  },
  "QuickMessageIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;             
    this.handler.state = ATEXTA_STATES.QUICKMSG;
    this.emitWithState("StartQuick", quickMsg);
  },
  "NewMessageIntent": function() {
    this.attributes["newMsg"] = this.event.request.intent.slots.NewMessage.value;    
    this.handler.state = ATEXTA_STATES.NEWMSG
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in start state: " + this.event.request.reason);
  }

});


let secretMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.SECRET, {

  "SendSecret": function(secretMsg) {
    let speechOutput = "inside secret intent";
    let cardTitle = "Atexta";
    let cardContent = this.t("SECRET_CONFIRM", secretMsg);
    //check database for secret message, bring back medium and group
    //pending on medium, trigger one of the functionalities to the group
    this.emit(":tellWithCard", speechOutput, cardTitle, cardContent)
    //if can't find secret message
    // this.emit(":ask", )
  }

  //recipientIntent
    //check for group, find medium, send accordingly, tellwithcard
    //if no group, reprompt

  //yes intent
  
  //no intent

  //help intent

  //cancel intent

  //stop intent
});

let quickMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.QUICKMSG, {

  "StartQuick": function(quickMsg) {
    //check database for msg and group
    //if no group, save msg to attributes and send to recipientintent

    //if no msg, send error/reprompt

    //if msg and group exist? send confirmation(yes/no)
  }

  //recipientIntent
    //check for group, find medium, send accordingly, tellwithcard
    //if no group, reprompt

  //yes intent
  
  //no intent

  //help intent

  //cancel intent

  //stop intent
});

let validateUser = function() {
  let accessToken = this.event.session.user.accessToken;
  if (accessToken) {
    return;
  } else {
    let speechOutput = this.t("LINK_ACCOUNT");
    this.emit(":tellWithLinkAccountCard", speechOutput)
  }
}