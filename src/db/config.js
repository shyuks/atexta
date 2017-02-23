'use strict'
const Sequelize = require('sequelize');
const cred = require('./keys.js');

module.exports.db = new Sequelize(`mysql://${cred.username}:${cred.password}@aws-us-east-1-portal.25.dblayer.com:17284/compose`);