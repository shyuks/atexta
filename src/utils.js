'use strict'
const http = require('http');
const https = require('https');

module.exports.triggerQuickCommand = (token, command) => {
  return new Promise ((resolve, reject) => {
  let options = {
  "method": "GET",
  "hostname": "enigmatic-wildwood-66230.herokuapp.com",
  "port": null,
  "path": "/triggerQuickCommand",
  "headers": {
    "token": token,
    "commandname": command,
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
      if (body === "Unauthorized") {
        console.log(body);
        resolve({invalidToken : true, body : body})
      } else {
        resolve(JSON.parse(body));
      }
    })
  })
  req.on('error', e => {
    reject(e);
  })
  req.end();
  })
};

module.exports.sendToGroup = (useremail, groupname, messageid, commandid, message) => {
 return new Promise ((resolve, reject) => {
   let options = {
    "method": "GET",
    "hostname": "enigmatic-wildwood-66230.herokuapp.com",
    "port": null,
    "path": "/sendToGroup",
    "headers": {
      "useremail": useremail,
      "groupname": groupname,
      "mediumtype": "0",
      "messageid": messageid,
      "commandid": commandid,
      "message": message,
      "cache-control": "no-cache"
    }
   }
  let body = '';
  let req = https.request(options, res => {
    res.on('data', d => {
      body += d;
    })
    res.on('error', e => {
      reject(e);
    })
    res.on('end', ()=>{
      console.log(body);
      resolve(JSON.parse(body));
    })
  })
  req.on('error', e => {
    reject(e);
  })
  req.end();
  })
};

module.exports.sendCustomMessage = (inputToken, group, message) => {
 return new Promise ((resolve, reject) => {
   let options = {
    "method": "GET",
    "hostname": "enigmatic-wildwood-66230.herokuapp.com",
    "port": null,
    "path": "/sendCustomMessage",
    "headers": {
      "token": inputToken,
      "groupname": group,
      "mediumtype": "0",
      "message": message,
      "cache-control": "no-cache"
    }
   }
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

module.exports.triggerSecretCommand = (inputToken, secretMsg) => {
 return new Promise ((resolve, reject) => {
   let options = {
    "method": "GET",
    "hostname": "enigmatic-wildwood-66230.herokuapp.com",
    "port": null,
    "path": "/triggerSecretCommand",
    "headers": {
      "token": inputToken,
      "secrettrigger": secretMsg,
      "cache-control": "no-cache"
    }
   }
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