const Sequelize = require('sequelize');
const cred = require('./keys.js');

var db = new Sequelize('myAtexta', cred.username, cred.password, {
  host: 'myatexta.c1qn5i5sh8u5.us-east-1.rds.amazonaws.com',
  port : 3306,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

module.exports = db;