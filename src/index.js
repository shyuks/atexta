"use strict";
const Alexa = require('alexa-sdk');
const APP_ID = 'amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f';
const utils = require('./utils');

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
      "LINK_ACCOUNT": "It seems as though your account isn't linked yet. " + 
        "Please open your Amazon Alexa app and sign into a texta. ",
      "NEW_USER": "It looks as though you haven\'t customized your settings yet. " + 
        "Please download the app or visit my a texta.com to utilize this skill. ",
      "NEW_USERCARD": "Please download the a texta app or visit www.my a texta.com to customize your messages.",
      "QUICK_NOCOMMAND": "I couldn\'t find that pre-saved message. What would you like to send? ",
      "QUICK_REPEAT": "What quick message would you like to send? ",
      "CONNECT_ERROR": "I\'m having issues accessing your list of messages at the moment. Please try again later. ",
      "CUSTOM_REPEAT": "What custom message would you like to send? ",
      "VERIFY_MESSAGE": "Command has been verified and is ready for future use. ",
      "VERIFY_MESSAGECARD": "The command, %s, has been verified and is ready for future use.",
      "SELECT_GROUP": "Who would you like to send this to? ",
      "GROUP_ERROR": "Could not find that group. Please say who you would like to send this to. ",
      "CONFIRM_SENT": "Message has been sent",
      "CONFIRM_QUICKCARD": "Quick message, %s, has been sent.",
      "CONFIRM_CARDMSG": "'%s' has been sent ",
      "CONFIRM_RECIPIENT": "to %s",
      "SECRET_CARD": "'%s' has been sent. ",
      "SECRET_ERROR": "I couldn\'t find that command. Please repeat your command. ",
      "SECRET_REPEAT": "What would you like to do? ",
      "HELP_SECRET": "Say one of your pre-saved commands to trigger an action. ",
      "HELP_MESSAGE": "You can send a pre-saved quick message by saying, send quick message, followed by what you\'d like to send. " +
        "Or send a new custom message by saying, send custom message, followed by your message.",
      "END_MESSAGE": "Goodbye.",
      "START_UNHANDLED": "Sorry, I didn\'t get that. What would you like to do? ",
      "QUICK_UNHANDLED": "To send a quick message, say, send quick message, before your message. ",
      "CUSTOM_UNHANDLED": "To send a custom message, say, send custom message, before your message. "
    }
  }
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.resources = languageString;
  alexa.registerHandlers(
    newSessionHandlers,
    startStateHandlers,
    quickMsgStateHandlers,
    customMsgStateHandlers,
    secretStateHandlers,
    helpStateHandlers
    );
  alexa.execute();
};

let newSessionHandlers = {
  "LaunchRequest": function() {;
    this.handler.state = ATEXTA_STATES.START;
    this.emitWithState("StartRequest");
  },
  "QuickIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.handler.state = ATEXTA_STATES.QUICK;
    this.emitWithState("SendQuickIntent");
  },
  "CustomIntent": function() {
    this.attributes["customMsg"] = this.event.request.intent.slots.CustomMessage.value;    
    this.handler.state = ATEXTA_STATES.CUSTOM;
    this.emitWithState("SendCustomIntent");
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
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

let startStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.START, {
  "StartRequest": function() {
    let token = this.event.session.user.accessToken;
    if (token) {
      let speechOutput = this.t("LAUNCH_MESSAGE");
      let repromptText = this.t("LAUNCH_REPROMPT");
      this.emit(":ask", speechOutput, repromptText);
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "QuickIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.handler.state = ATEXTA_STATES.QUICK;
    this.emitWithState("SendQuickIntent");
  },
  "CustomIntent": function() {
    this.attributes["customMsg"] = this.event.request.intent.slots.CustomMessage.value;    
    this.handler.state = ATEXTA_STATES.CUSTOM;
    this.emitWithState("SendCustomIntent");
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
  },
  "AMAZON.RepeatIntent": function() {
    let speechOutput = this.t("LAUNCH_REPROMPT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "AMAZON.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", false);
  },
  "Unhandled": function() {
    let speechOutput = this.t("START_UNHANDLED");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in new session state: " + this.event.request.reason);
  }
});

let quickMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.QUICK, {
  "SendQuickIntent": function() {
    let token = this.event.session.user.accessToken;
    let quickMsg = this.attributes["quickMsg"];
    if (token) {
      utils.triggerQuickCommand(token, quickMsg)
      .then(results => {
        if (results.newUser) {
          let speechOutput = this.t("NEW_USER");
          let cardTitle = "Atexta";
          let cardContent = this.t("NEW_USERCARD");
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        } else if (results.NoCommand) {
          let speechOutput = this.t("QUICK_NOCOMMAND");
          let repromptText = this.t("QUICK_REPEAT");
          this.attributes["repeatPrompt"] = speechOutput;
          this.emit(":ask", speechOutput, repromptText);
        } else if (results.NotVerified) {
          let speechOutput = this.t("VERIFY_MESSAGE");
          let cardTitle = "Atexta";
          let cardContent = this.t("VERIFY_MESSAGECARD", quickMsg);
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        } else if (results.NoGroup) {
          this.attributes["email"] = results.email;
          this.attributes["data"] = results.data;
          let speechOutput = this.t("SELECT_GROUP");
          this.attributes["repeatPrompt"] = speechOutput;
          this.emit(":ask", speechOutput, speechOutput);
        } else {
          let speechOutput = this.t("CONFIRM_SENT");
          let cardTitle = "Atexta";
          let cardContent = this.t("CONFIRM_QUICKCARD", quickMsg);
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        }
      })
      .catch(error => {
        let speechOutput = this.t("CONNECT_ERROR");
        this.emit(":tell", speechOutput);
      })
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "QuickIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.emitWithState("SendQuickIntent");
  },
  "RecipientIntent": function() {
    let useremail = this.attributes["email"];
    let group = this.event.request.intent.slots.Group.value;
    let messageid = this.attributes["data"].MessageId;
    let commandid = this.attributes["data"].CommandId;
    let message = this.attributes["data"].text;
    let quickMsg = this.attributes["quickMsg"];
    utils.sendToGroup(useremail, group, messageid, commandid, message)
    .then(results => {
      if (results.sentEmail || results.sentText) {
        let speechOutput = this.t("CONFIRM_SENT");
        let cardTitle = "Atexta";
        let cardContent = this.t("CONFIRM_CARDMSG", quickMsg) + this.t("CONFIRM_RECIPIENT", group);
        this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
      } else {
        let speechOutput = this.t("GROUP_ERROR");
        this.attributes["repeatPrompt"] = speechOutput;
        this.emit(":ask", speechOutput, speechOutput);
      }
    })
    .catch(error => {
      let speechOutput = this.t("CONNECT_ERROR");
      this.emit(":tell", speechOutput);
    })
  },
  "AMAZON.RepeatIntent": function() {
    let speechOutput = this.attributes["repeatPrompt"] || this.t("QUICK_REPEAT");
    this.emit(":ask", speechOutput, speechOutput)
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", false);
  },
  "AMAZON.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Unhandled": function() {
    let speechOutput = this.t("QUICK_UNHANDLED");
    this.emit(":ask", speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in quick state: " + this.event.request.reason);
  }
});

let customMsgStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.CUSTOM, {
  "SendCustomIntent": function() {
    let token = this.event.session.user.accessToken;
    if (token) {
      let speechOutput = this.t("SELECT_GROUP");
      this.attributes["repeatPrompt"] = speechOutput;
      this.emit(":ask", speechOutput, speechOutput);
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "CustomIntent": function() {
    this.attributes["customMsg"] = this.event.request.intent.slots.CustomMessage.value;
    this.emitWithState("SendCustomIntent");
  },
  "RecipientIntent": function() {
    let token = this.event.session.user.accessToken;
    let group = this.event.request.intent.slots.Group.value;
    let customMsg = this.attributes["customMsg"];
    utils.sendCustomMessage(token, group, customMsg)
    .then(results => {
      if (results.newUser) {
        let speechOutput = this.t("NEW_USER");
        let cardTitle = "Atexta";
        let cardContent = this.t("NEW_USERCARD");
        this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
      } else if (results.sentEmail || results.sentText) {
        let speechOutput = this.t("CONFIRM_SENT");
        let cardTitle = "Atexta";
        let cardContent = this.t("CONFIRM_CARDMSG", customMsg) + this.t("CONFIRM_RECIPIENT", group);
        this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
      } else {
        let speechOutput = this.t("GROUP_ERROR");
        this.attributes["repeatPrompt"] = speechOutput;
        this.emit(":ask", speechOutput, speechOutput);
      }
    })
    .catch(error => {
      let speechOutput = this.t("CONNECT_ERROR");
      this.emit(":tell", speechOutput);
    })
  },
  "AMAZON.RepeatIntent": function() {
    let speechOutput = this.attributes["repeatPrompt"] || this.t("CUSTOM_REPEAT");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", false);
  },
  "AMAZON.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "Unhandled": function() {
    let speechOutput = this.t("CUSTOM_UNHANDLED");
    this.emit(":ask", speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in custom state: " + this.event.request.reason);
  }
});

let secretStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.SECRET, {
  "SendSecretIntent": function() {
    let token = this.event.session.user.accessToken;
    let secretMsg = this.attributes["secretMsg"];
    if (token) {
      utils.triggerSecretCommand(token, secretMsg)
      .then(results => {
        if (results.newUser) {
          let speechOutput = this.t("NEW_USER");
          let cardTitle = "Atexta";
          let cardContent = this.t("NEW_USERCARD");
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        } else if (results.NoCommand) {
          let speechOutput = this.t("SECRET_ERROR");
          this.attributes["repeatPrompt"] = speechOutput;
          this.emit(":ask", speechOutput, speechOutput);
        } else if (results.NotVerified) {
          let speechOutput = this.t("VERIFY_MESSAGE");
          let cardTitle = "Atexta";
          let cardContent = this.t("VERIFY_MESSAGECARD", secretMsg);
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        } else {
          let speechOutput = results.response;
          let cardTitle = "Atexta";
          let cardContent = this.t("SECRET_CARD", secretMsg);
          this.emit(":tellWithCard", speechOutput, cardTitle, cardContent);
        }
      })
      .catch(error => {
        let speechOutput = this.t("CONNECT_ERROR");
        this.emit(":tell", speechOutput);
      })
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(":tellWithLinkAccountCard", speechOutput)
    }
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.emitWithState("SendSecretIntent");
  },
  "AMAZON.RepeatIntent": function() {
    let speechOutput = this.t("SECRET_REPEAT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpUser", true);
  },
  "AMAZON.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in secret state: " + this.event.request.reason);
  }
});

let helpStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.HELP, {
  "helpUser": function(secret) {
    let speechOutput = secret ? this.t("HELP_SECRET") : this.t("HELP_MESSAGE");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "QuickIntent": function() {
    this.attributes["quickMsg"] = this.event.request.intent.slots.QuickMessage.value;
    this.handler.state = ATEXTA_STATES.QUICK;
    this.emitWithState("SendQuickIntent");
  },
  "CustomIntent": function() {
    this.attributes["customMsg"] = this.event.request.intent.slots.CustomMessage.value;    
    this.handler.state = ATEXTA_STATES.CUSTOM;
    this.emitWithState("SendCustomIntent");
  },
  "SecretIntent": function() {
    this.attributes["secretMsg"] = this.event.request.intent.slots.SecretMessage.value;
    this.handler.state = ATEXTA_STATES.SECRET;
    this.emitWithState("SendSecretIntent");
  },
  "AMAZON.RepeatIntent": function() {
    let speechOutput = this.t("SECRET_REPEAT")
    this.emit(":ask", speechOutput, speechOutput)
  },
  "AMAZON.HelpIntent": function() {
    this.emitWithState("helpUser", true);
  },
  "AMAZON.StopIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    let speechOutput = this.t("END_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in help state: " + this.event.request.reason);
  }
});
