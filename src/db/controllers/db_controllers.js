const http = require ('http');
const https = require ('https');
const querystring = require('querystring');
const twilio = require('../../apiComm/controllers/twilio_controllers');
const mailGun = require('../../apiComm/controllers/email_controllers');

module.exports.getIntentInfo = (inputToken, inputCommand) => {
  return new Promise ((resolve, reject) => {
    let options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :'/getIntentInfo',
      method : 'GET',
      headers : {
        token : inputToken,
        commandname : inputCommand
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

module.exports.getGroupInfo = (inputEmail, inputGroup) => {
  return new Promise ((resolve, reject) => {
    let options = {
      hostname : 'enigmatic-wildwood-66230.herokuapp.com',
      path :'/getGroupInfo',
      method : 'GET',
      headers : {
        userEmail : inputEmail,
        groupName : inputGroup
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