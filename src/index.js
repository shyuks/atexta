var Alexa = require('alexa-sdk');
var APP_ID = "amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f";
var http = require ('http');
var https = require ('https');
var querystring = require('querystring');

var ATEXTA_STATES = {
  START: "_STARTMODE",
  MESSAGE: "_MESSAGEMODE",
  QUICK: "_QUICKMODE",
  CUSTOM: "_CUSTOMMODE",
  HELP: "_HELPMODE"
};

var languageString = {
  "en-US": {
    "translation": {
      "WELCOME_MESSAGE": "Hello, how may I help you? ",
      "WELCOME_REPROMPT": "Tell me a command, or you can ask for help. ",
      "HELP_MESSAGE": "You can send a pre-saved quick message by saying, send quick message. " +
      "Or send a new custom message by saying, send custom message.",
      // "REPEAT_MESSAGE": "To repeat the last question, say, repeat. ",
      // "ASK_MESSAGE_START": "Would you like to start playing?",
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

exports.handler = (event, context, callback) => {
  let alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.resources = languageString;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

let newSessionHandlers = {
  "LaunchRequest": () => {
    this.handler.state = ATEXTA_STATES.START;
    this.emitWithState("StartRequest");
  },
  "AMAZON.StartOverIntent": () => {
    this.handler.state = ATEXTA_STATES.START;
    this.emitWithState("StartRequest");
  },
  "AMAZON.HelpIntent": () => {
    this.handler.state = ATEXTA_STATES.HELP;
    this.emitWithState("helpTheUser");
  },
  "Unhandled": () => {
    var speechOutput = this.t("START_UNHANDLED");
    this.emit(":ask", speechOutput, speechOutput);
  }
};

let startStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.START, {
  
  "StartRequest": () => {
    let accessToken = this.event.session.user.accessToken;             
    
    if (accessToken) {           
      let speechOutput = this.t("WELCOME_MESSAGE");
      let repromptText = this.t("WELCOME_REPROMPT");
      
      //check to see if user has email stored in session
      
      //if no,
      // get user email for future calls
      getUserInfo(accessToken)
      .then(result => {
        //save email to session for future calls?
        Object.assign(this.attributes, {
          // "speechOutput": repromptText,
          // "repromptText": repromptText,
          "AuthUserInfo": accessToken 
        });

        //if yes, send directly to messages with email

        this.handler.state = ATEXTA_STATES.MESSAGE;
        this.emit(":ask", speechOutput, repromptText);
      })
      .catch(error => {
        this.emit(':tell', "Error in getting user info. ");
      })

    
    } else {
      let speechOutput = this.t("LINK_ACCOUNT");
      this.emit(':tellWithLinkAccountCard', speechOutput)
    }
  }
});

var messageStateHandlers = Alexa.CreateStateHandler(ATEXTA_STATES.MESSAGE, {
  let req = this.event.request.intent.slots;

  "SecretIntent": () => {
    let secretMsg = req.SecretMessage.value;
    let speechOutput = 'inside secret intent';
    let cardTitle = "Atexta";
    let cardContent = this.t("SECRET_CONFIRM", secretMsg);
    //check database for secret message, bring back medium and group

    //pending on medium, trigger one of the functionalities to the group
    


    this.emit(':tellWithCard', speechOutput, cardTitle, cardContent)

    //if can't find secret message
    
    this.emit(':ask')
  }
  
  "QuickMessageIntent": function () {
    let quickMsg = req.QuickMessage.value;             
    this.handler.state = ATEXTA_STATES.QUICK;
    this.emitWithState("StartRequest");

    //change state to Quick and 
    //check database for quickMsg and group
  
    //if group is empty, send to recipientIntent

  });

  "NewMessageIntent": function () {
    let quickMsg = req.QuickMessage.value;             
    
    //check database for quickMsg and group

    //if group is empty, send to recipientIntent

  });

});



Atexta.prototype = Object.create(Alexa.prototype);

Atexta.prototype.constructor = Atexta;

Atexta.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session, response) {
  if(!session.user.accessToken) {
    var text = "Link skill to amazon account for use."
    var output = {
      speech : text,
      type : Alexa.speechOutputType.PlainText
    }
    response.tellWithCard(output);

  } else {
    getUserInfo(session.user.accessToken)
    .then(user => { 
      session.user['AuthUserInfo'] = user;
     var text = "User account verified"
     var output = {
      speech : text,
      type : Alexa.speechOutputType.PlainText
    }
    response.tellWithCard(output); 
    })
    .catch(error => {
     var text = "I'm having a hard time getting your information"
     var output = {
      speech : text,
      type : Alexa.speechOutputType.PlainText
    }
    response.tellWithCard(output);     
    })
  }
};

Atexta.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    response.ask(helpText, helpText);
};

Atexta.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    session.attributes = {};
};

Atexta.prototype.intentHandlers = {
    
	"SecretIntent": function (intent, session, response) {

	sendInstructions(JSON.stringify(session))
    .then(result => {
      var output = {
        speech : result,
        type : Alexa.speechOutputType.PlainText
      };
    
      response.tellWithCard(output);
    })
    },
    
	"QuickMessageIntent": function (intent, session, response) {
		var name = intent.slots.QuickMessage;
		session.attributes['MessageTrigger'] = name.value;

    sendInstructions(name.value)
    .then(result => {
        
      if(result){
        var res = "Message sent";
        
        var output = {
          speech : res,
          type : Alexa.speechOutputType.PlainText
        }
        
        response.tellWithCard(output);
      } else {
          
        response.ask(askRecipient);
      }
    }).catch(error => {
        
      var output = {
        speech : "<speak>An error occured, please try again</speak>",
        type : Alexa.speechOutput.SSML
      }
      
      response.tellWithCard(output);
    });

    },
    
    "RecipientIntent": function (intent, session, response) {
        
      session.attributes['Group'] = intent.slots.Group.value;
      sendInstructions(session.attributes)
      .then(result => {
          
        var output = {
          speech : result,
          type : Alexa.speechOutputType.PlainText
        }
        
        response.tellWithCard(output);
      })
      .catch(error => {
          
        var output = {
          speech : "<speak>An error occured, please try again</speak>",
          type : Alexa.speechOutputType.PlainText
        }
        
        response.tellWithCard(output);
      })
		
	
    },
    
    "NewMessageIntent": function (intent, session, response) {
        var type = intent.slots.NewMessage;
        session.attributes['Type'] = type.value;

        response.ask(getMessage)
    },
    
    "MessageInputIntent" : function (intent, session, response) {
        session.attributes['CustomMessage'] = intent.slots.MessageInput.value;
        
        response.ask(askRecipient)
    }
};

var sendInstructions = (intentValue) => {
  return new Promise ((resolve, reject) => {
    var postData = querystring.stringify({
        'Alexa IntentRequest' : JSON.stringify(intentValue)
    })
    var options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :'/fromAlexa',
      method : 'POST',
      headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
      }
    }
    var endReq = (body) => {
        req.end;
        resolve(body);
    }
    var req = http.request(options, (res) => {
      var body = '';
      res.on('data', (d) => {
          body += d;
        });

      res.on('error', (e) => {
        reject(e);
      });

      res.on('end', function(){
      endReq(body);
      });
    });
    req.write(postData);
  })
}

var getUserInfo = (token) => {
  return new Promise ((resolve, reject) => {
  var options = {
  "method": "GET",
  "hostname": "rakan.auth0.com",
  "port": null,
  "path": "/userinfo",
  "headers": {
    "authorization": `Bearer ${token}`,
    "cache-control": "no-cache"
    }
  };
  var body = '';
  var req = https.request(options, res => {
    res.on('data', d => {
      body += d;
    })
    
    res.on('error', e => {
      reject(e);
    })
    
    res.on('end', ()=>{
      resolve(body);
    })
  })
  
  req.on('error', e => {
    reject(e);
  })

  req.end();
  })
}