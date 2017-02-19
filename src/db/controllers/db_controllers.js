var db = require('./db/config');
// var Promise = require('bluebird');
var Sequelize = require('sequelize');
var moment = require('moment')().format('YYYY-MM-DD HH:mm:ss');

db.sync();

module.exports.GetIntentInfo = (userInfo, commandName) => {
  return new Promise ((resolve, reject) => {
    db.query('select * from User where email = ?', {
      replacements: [userInfo.email],
      type: Sequelize.QueryTypes.SELECT
    })
    .then(result => {
      if (result.length === 0) {
        db.query('insert into User (email, name, authString, createdAt, updatedAt) values (?, ?, ?, ?, ?)', {
          replacments: [userInfo.email, userInfo.name, JSON.stringify(userInfo), moment(new Date()), moment(new Date())]
          type: Sequelize.QueryTypes.INSERT
        })
        .then(createdUser => {
          resolve({newUser: true})
        })
        .catch(err => {
          reject(err);
        })
      } else {
        db.query('select * from Command C join Message M on C.messageId = M.id where userId = ? and name = ?', {
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
              group: []
            })
          } else {
            db.query('select R.* from Group G join GroupRecipients GR on G.id = GR.groupId join Recipient R on GR.recipientId = R.id where G.id = ?', {
              replacements: [foundCommand[0].groupId],
              type: Sequelize.QueryTypes.SELECT
            })
            .then(finalResult => {

            })
          }
        })
      }
    })
  });
}

module.exports.GetGroupInfo = (groupName) => {
  return new Promise ((resolve, reject) => {
  
  });
}