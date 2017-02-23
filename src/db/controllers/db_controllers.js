const http = require ('http');
const https = require ('https');
const querystring = require('querystring');
const twilio = require('../../apiComm/controllers/twilio_controllers');
const mailGun = require('../../apiComm/controllers/email_controllers');

let sendInstructions = (intentValue) => {
  return new Promise ((resolve, reject) => {
    let postData = querystring.stringify({
        'Alexa IntentRequest' : JSON.stringify(intentValue)
    })
    let options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :'/fromAlexa',
      method : 'POST',
      headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
      }
    }
    let endReq = (body) => {
        req.end;
        resolve(body);
    }
    let req = http.request(options, (res) => {
      let body = '';
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

// module.exports.getUserInfo = (token) => {
//   return new Promise ((resolve, reject) => {
//   let options = {
//   "method": "GET",
//   "hostname": "rakan.auth0.com",
//   "port": null,
//   "path": "/userinfo",
//   "headers": {
//     "authorization": `Bearer ${token}`,
//     "cache-control": "no-cache"
//     }
//   };
//   let body = '';
//   let req = https.request(options, res => {
//       res.on('data', d => {
//           body += d;
//       })
      
//       res.on('error', e => {
//           reject(e);
//       })
      
//       res.on('end', ()=>{
//           resolve(body);
//       })
//   })
  
//   req.on('error', e => {
//         reject(e);
//   })
  
//   req.end();
//   })
// }

module.exports.getIntentInfo = (inputToken, inputCommandName) => {
  return new Promise ((resolve, reject) => {
    let options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :'/getIntentInfo',
      method : 'GET',
      headers : {
        token : inputToken,
        commandname : inputCommandName
      }
    }
    let endReq = (body) => {
        req.end;
        resolve(JSON.parse(body));
    }
    let req = http.request(options, (res) => {
      let body = '';
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
  })
}

module.exports.getGroupInfo = (inputToken, commandName) => {
  return new Promise ((resolve, reject) => {
    let options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :`/fromAlexa/${token}/${commandName}`,
      method : 'GET'
    }
    let endReq = (body) => {
        req.end;
        resolve(JSON.parse(body));
    }
    let req = http.request(options, (res) => {
      let body = '';
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
  })
}

let GetGroupInfo = (userEmail, groupName, message) => {
 return new Promise ((resolve, reject) => {
  db.query('select R.name, R.contactInfo, R.mediumType from Users U join Groups G on G.userId = U.id join GroupRecipients GR on GR.groupId = G.id join Recipients R on GR.recipientId = R.id where U.email = ? and G.name = ?',
  {replacements : [userEmail, groupName], type : Sequelize.QueryTypes.SELECT})
  .then(groupInfo => {
       console.log('groupInfo :', JSON.parse(JSON.stringify(groupInfo)))
    if (groupInfo.length === 0) {
      resolve({group : false})
    } else {
      if (groupInfo[0].mediumType === 'T') {
     
        groupInfo.forEach(recipient => {
          twilio.sendText(recipient.contactInfo, recipient.name);
        })
        db.close();
        resolve({info: 'Text Messages Sent'});
      } else if (groupInfo[0].mediumType === 'E') {
        groupInfo.forEach(recipient => {
          mailGun.sendEmail(recipient.contactInfo, message)
        })
        db.close();
        resolve({info:  'Emails Sent'})
      }
    }
  })
 });
}
module.exports.GetGroupInfo = GetGroupInfo;