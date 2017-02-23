'use strict';
const keys = require('../../db/keys');
const twilio = require('twilio');

const client = twilio(keys.twilioKey, keys.twilioID);

module.exports.sendText = (recipient, text) => {
  console.log(recipient, text);
  client.sendMessage({
    to : '7144864486',
    from: '12134863241',
    body: `rec:${recipient} txt:${text}`
  })
}