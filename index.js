var http = require('http');
var querystring = require('querystring')

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

exports.handler = (event, context) => {

  try {

    switch (event.request.type){

      case "LaunchRequest":
        context.succeed(generateResponse("Hello, how can I help you?", false))
        break;
      
      case "IntentRequest":

        switch(event.request.intent.name){

          case "SecretIntent":
          sendInstructions('Message from Secret Intent')
          .then(result => {
            context.succeed(generateResponse("Can't find song", true));
          }).catch(error => { 
            context.succeed(generateResponse("I didn't get that, try again.", false))
          })
          break;

          case "QuickMessageIntent":
          sendInstructions(event.request.intent.slots.QuickMessage.value)
          .then(result => {
            context.succeed(generateResponse("Message Sent", true));
          })
          .catch(error => {
            context.succeed(generateResponse("I didn't get that, try again.", false))
          })
          break;

          case "MyMessageIntent":
          sendInstructions(event.request.intent.slots.MyMessage.value)
          .then(result => {
            event.session.attributes['MessageName'] = event.request.intent.slots.MyMessage.value;
            context.succeed(generateResponse("Who should I send this to?", false));
          })
          .catch(error => {
            context.succeed(generateResponse("I don't have that message saved, try again.", false))
          })
          break;

          case "RecipientIntent":
          sendInstructions({
            customMessage: event.session.attributes.CustomMessage || null,
            medium: event.session.attributes.Medium || null,
            messsage: event.session.attributes.MessageName, 
            recipient: event.request.intent.slots.Group.value})
          .then(result => {
            context.succeed(generateResponse("Message Sent", true));
          })
          .catch(error => {
            context.succeed(generateResponse("I can't find the recipient", false))
          })
          break;

          case "NewMessageIntent":
          sendInstructions(event.request.intent.slots.NewMessage.value)
          .then(result => {
            event.session.attributes['Medium'] = event.request.intent.slots.NewMessage.value;
            context.succeed(generateResponse("What would you like to send?", false));
          })
          .catch(error => {
            context.succeed(generateResponse("I didn't get that, try again please.", true))
          })
          break;

          case "MessageInputIntent":
          sendInstructions(event.request.intent.slots.MessageInput.value)
          .then(result => {
            event.session.attributes['CustomMessage'] = event.request.intent.slots.MessageInput.value;
            context.succeed(generateResponse("Who should I send this to?", false))
          })
          .catch(error => {
            context.succeed(generateResponse("I don't have that message saved, try again.", false))
          })
          break;
          
          default:
          context.succeed(generateResponse("I'm having an issue, try again please.", true)) 
        }
        break;
        
      case "SessionEndedRequest":
          console.log('Session Ended');
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)
    }

  } catch (error) {
    context.fail(`Exception: ${error}`)
  }
}


generateResponse = (outputText, shouldEndSession) => {
  return {
    version: "1.0",
    response : {
        outputSpeech : {
            type : "PlainText",
            text : outputText 
        }
    }, 
    shouldEndSession : shouldEndSession
  }
}