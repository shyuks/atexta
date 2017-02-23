'use strict'
const http = require ('http');
const https = require ('https');
const db = require('../config');
const moment = require('moment')
const twilio = require('../../apiComm/controllers/twilio_controllers');
const mailGun = require('../../apiComm/controllers/email_controllers');

module.exports.getUserInfo = (token) => {
  return new Promise ((resolve, reject) => {

  let options = {
  "method": "GET",
  "hostname": "rakan.auth0.com",
  "port": null,
  "path": "/userinfo",
  "headers": {
    "authorization": `Bearer ${token}`,
    "cache-control": "no-cache"
    }
  };

  let body = '';
  let req = https.request(options, res => {
      res.on('data', d => {
          body += d;
      })
      res.on('error', e => {
          reject(e);
      })
      res.on('end', ()=>{
          resolve(JSON.parse(body));
      })
  })
  req.on('error', e => {
        reject(e);
  })
  req.end();
  })
}

module.exports.getIntentInfo = (userInfo, commandName) => {
 return new Promise ((resolve, reject) => {
   db.query('select * from Users where email = ?', {
     replacements: [userInfo.email],
     type: Sequelize.QueryTypes.SELECT
   })
   .then(result => {
     if (result.length === 0) {
       let currDate = moment().format();
       currDate = currDate.replace('T', ' ').substr(0, 19);
       db.query(`insert into Users (email, name, createdAt, updatedAt) value ("${userInfo.email}", "${userInfo.name}", "${currDate}", "${currDate}")`, {
         type: Sequelize.QueryTypes.INSERT
       })
       .then(createdUser => {
         resolve({newUser: true})
       })
       .catch(err => {
         reject(err);
       })
     } else {
       db.query('select C.name as commandName, G.name as groupName, M.text, R.name as recipientName, R.mediumType, R.contactInfo from Commands C join Messages M on C.messageId = M.id left outer join Groups G on G.id = C.groupId left outer join GroupRecipients GR on GR.groupId = C.groupId left outer join Recipients R on R.id = GR.recipientId where C.userId = ? and UPPER(C.name) = UPPER(?)', {
         replacements: [result[0].id, commandName],
         type: Sequelize.QueryTypes.SELECT
       })
       .then(foundCommand => {
         if (foundCommand.length === 0) {
           resolve({
             newUser: false,
             command: false
           })
         } else if (foundCommand[0].groupId === null) {
           resolve({
             newUser: false,
             command: true,
             group: false,
             data: foundCommand[0].text
           })
         } else {
           handleCommand(foundCommand, foundCommand[0].text);
            resolve({
              newUser: false,
              command : true,
              group: true,
              data: foundCommand
            })
         }
       })
     }
   })
 });
}

module.exports.getGroupInfo = (userEmail, groupName, type = null) => {
 return new Promise ((resolve, reject) => {
  let str = (type === null ? '' : "and G.mediumType = ?");
  let rep = (type === null ? [userEmail, groupName] : [userEmail, groupName, type]);
  db.query(`select R.name, R.contactInfo, R.mediumType from Users U join Groups G on G.userId = U.id join GroupRecipients GR on GR.groupId = G.id join Recipients R on GR.recipientId = R.id where U.email = ? and G.name = ? ${str}`,
  {replacements : rep, type : Sequelize.QueryTypes.SELECT})
  .then(groupInfo => {
    if (groupInfo.length === 0) {
      resolve({group : false})
    } else {
      handleCommand(groupInfo, message);
      resolve({data: groupInfo});
    }
  })
 });
}

let HandleCommand = (groupInfo, message) => {
  if (groupInfo[0].mediumType === 'T') {
    groupInfo.forEach(recipient => {
      twilio.sendText(recipient.contactInfo, message);
      // console.log(JSON.stringify(recipient))
    })
  } else if (groupInfo[0].mediumType === 'E') {
    groupInfo.forEach(recipient => {
      // console.log(JSON.stringify(recipient))
      // mailGun.sendEmail(recipient.contactInfo, message);
    })
  }
}

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