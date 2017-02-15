var APP_ID = "amzn1.ask.skill.50922e58-7ef6-4b08-b502-9b931eba482f";
var AlexaSkill = require('./AlexsaSkill');
var http = require ('http');
var https = require ('https');
var helpText = "Hello there!";
var askRecipient = "To who should I send the message?";
var getMessage = "What should I send?";
var querystring = require('querystring');

var Atexta = function (){
  AlexaSkill.call(this,APP_ID);
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

Atexta.prototype = Object.create(AlexaSkill.prototype);

Atexta.prototype.constructor = Atexta;

Atexta.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session, response) {
  if(!session.user.accessToken) {
    var text = "Link skill to amazon account for use."
    var output = {
      speech : text,
      type : AlexaSkill.speechOutputTYpe.PlainText
    }
    response.tellWithCard(output);

  } else {
    getUserInfo(session.user.accessToken)
    .then(user => { 
      session.user['AuthUserInfo'] = user;
     var text = "User account verified"
     var output = {
      speech : text,
      type : AlexaSkill.speechOutputTYpe.PlainText
    }
    response.tellWithCard(output); 
    })
    .catch(error => {
     var text = "I'm having a hard time getting your information"
     var output = {
      speech : text,
      type : AlexaSkill.speechOutputTYpe.PlainText
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
        type : AlexaSkill.speechOutputType.PlainText
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
          type : AlexaSkill.speechOutputType.PlainText
        }
        
        response.tellWithCard(output);
      } else {
          
        response.ask(askRecipient);
      }
    }).catch(error => {
        
      var output = {
        speech : "<speak>An error occured, please try again</speak>",
        type : AlexaSkill.speechOutput.SSML
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
          type : AlexaSkill.speechOutputType.PlainText
        }
        
        response.tellWithCard(output);
      })
      .catch(error => {
          
        var output = {
          speech : "<speak>An error occured, please try again</speak>",
          type : AlexaSkill.speechOutputType.PlainText
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

exports.handler = function (event, context) {
  var atexta = new Atexta();
  atexta.execute(event, context);
};