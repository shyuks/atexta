'use strict';
const keys = require('../../db/keys')
const mailgun = require('mailgun-js')({apiKey: keys.emailKey, domain: keys.emailDomain});
 
module.exports.sendEmail = (recipient, message) => {
  let data = {
    from: 'Mailgun Sandbox <postmaster@sandbox44cda2e06ef8459d8a4b65d5038f6d39.mailgun.org>',
    to: 'rnesh90@yahoo.com',
    subject: 'Hello',
    text: `recipient : ${recipient}, message: ${message}`
  };
  mailgun.messages().send(data);
}