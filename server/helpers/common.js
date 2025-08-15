let jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const async = require("async");
const cron = require("node-cron");
var Client = require("node-rest-client").Client;
var restCli = new Client();

//schemas
const users = require("../model/users");
const wallet = require("../model/userWallet");
const currency = require("../model/currency");
const cloudinary = require("./cloudinary");
const endecrypt = require("./newendecryption");
const siteSettings = require("../model/siteSettings");

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

var socket = 0;
exports.SocketInit = function (socketIO) {
  socket = socketIO;
};
var client = [];
let authKey = "OSgPuToUnMnSHmnIaDLAeaXa";

exports.singleUploadcheck = function (req, callback) {
  var uploadImg = "";
  if (
    typeof req.file != "undefined" &&
    typeof req.file != undefined &&
    req.file.path != ""
  ) {
    cloudinary.uploadImage(req.file.path, function (imgRes) {
      if (imgRes != undefined) {
        uploadImg = imgRes.secure_url;
        callback(uploadImg);
      } else {
        callback(uploadImg);
      }
    });
  } else {
    callback(uploadImg);
  }
};

exports.formatTrdDate = function (time) {
  let obj = new Date(time);
  let ts = obj.getTime() / 1000;
  return parseInt(ts);
};

exports.generateRandomNumber = function () {
  let text = "";
  let possible = "0123456789";
  for (let i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

exports.randomString = function (len) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

exports.updateUserBalance = function (userId, curr, amount, callback) {
  wallet
    .updateOne(
      { user_id: mongoose.mongo.ObjectId(userId), "wallet.currency": curr },
      { $set: { "wallet.$.amount": +parseFloat(amount).toFixed(8) } },
      { multi: true }
    )
    .exec(function (balErr, balRes) {
      if (balRes) {
        callback(balRes);
      } else {
        callback(false);
      }
    });
};

exports.findUserBalance = (userId, curr, callback) => {
  wallet
    .findOne(
      { user_id: mongoose.mongo.ObjectId(userId) },
      { wallet: { $elemMatch: { currency: curr } } }
    )
    .exec(function (err, resData) {
      if (resData) {
        if (resData.wallet.length > 0) {
          let amount = resData.wallet[0].amount;
          callback(amount);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
};

exports.multiBalance = (userId, curr1, curr2, callback) => {
  wallet
    .findOne(
      { user_id: mongoose.mongo.ObjectId(userId) },
      { wallet: 1, _id: 0 }
    )
    .exec(function (err, resData) {
      if (resData) {
        var newBal = [];
        var i = 1;
        var len = resData.wallet.length;
        resData.wallet.forEach((val) => {
          if (val.currency == curr1 || val.currency == curr2) {
            newBal[val.currency] = val.amount;
            if (newBal[curr1] != undefined && newBal[curr2] != undefined) {
              callback(newBal);
              return;
            }
          }
          if (i == len) {
            if (newBal[curr1] == undefined) {
              newBal[curr1] = 0;
            }
            if (newBal[curr2] == undefined) {
              newBal[curr2] = 0;
            }
            callback(newBal);
          }
          i = i + 1;
        });
      } else {
        callback(false);
      }
    });
};

exports.generateRandomUser = function () {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 15; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

exports.activateWallet = (data, wal, callback) => {
  var i = 1;
  var len = data.length;
  data.forEach((val) => {
    var curr = val.currency;
    wal.wallet.push({ currency: curr, amount: 0 });
    if (i == len) {
      callback(wal);
    }
    i = i + 1;
  });
};

exports.createPayload = (key) => {
  let payload = {
    secret: key,
    WigrNvGUomqlDeK: "PcOIFafa23809UasILfaPOsfnfaoISF2",
  };
  let token = jwt.sign(payload, authKey, { expiresIn: 180 * 60 });
  return token;
};

exports.logout = (token) => {
  var ceck = jwt.decode(token);
};

exports.getUserId = (token) => {
  try {
    let payload = jwt.verify(token, authKey);
    if (payload) {
      return payload.secret;
    }
    return false;
  } catch (e) {
    return false;
  }
};

var orgArrVal = [
  "http://localhost:4200",
  "http://localhost:1201",
  "https://mhrwsoyugc.rollgame.io",
  "http://192.168.1.110:1201",
  "https://bc-game-8yju.vercel.app",
];

exports.apiMiddleware = (req, res, next) => {
  const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
  const [api, secret] = Buffer.from(b64auth, "base64").toString().split(":");
  if (api != "" && api != undefined && secret != "" && secret != undefined) {
    users
      .findOne({ api_key: api, secret_key: secret }, { _id: 1 })
      .exec(function (err, usrData) {
        if (usrData) {
          req.userId = usrData._id.toString();
          next();
        } else {
          return res.json({ success: 0, error: "Invalid API Keys" });
        }
      });
  } else {
    return res.json({ success: 401, error: "Unauthorized request" });
  }
};

exports.tokenMiddleware = (req, res, next) => {
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) {
      return res.json({ success: 401, msg: "Unauthorized request" });
    }
    token = token.split(" ")[1];
    if (token === "null") {
      return res.json({ success: 401, msg: "Unauthorized request" });
    } else {
      try {
        let payload = jwt.verify(token, authKey);
        if (!payload) {
          return res.json({ success: 401, msg: "Unauthorized request" });
        }
        if (payload.WigrNvGUomqlDeK == "PcOIFafa23809UasILfaPOsfnfaoISF2") {
          req.userId = payload.secret;
          next();
        } else {
          return res.json({ success: 401, msg: "Unauthorized request" });
        }
      } catch (e) {
        return res.json({ success: 401, msg: "Unauthorized request" });
      }
    }
  } else {
    return res.json({ success: 401, msg: "Unauthorized Request" });
  }
};

exports.userVerify = (req, res, next) => {
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) {
      return res.json({ success: 401, msg: "Unauthorized" });
    }
    token = token.split(" ")[1];
    if (token === "null") {
      return res.json({ success: 401, msg: "Unauthorized" });
    } else {
      try {
        let payload = jwt.verify(token, authKey);
        if (!payload) {
          return res.json({ success: 401, msg: "Unauthorized" });
        }
        if (payload.WigrNvGUomqlDeK == "PcOIFafa23809UasILfaPOsfnfaoISF2") {
          req.userId = payload.secret;
          next();
        } else {
          return res.json({ success: 401, msg: "Unauthorized request" });
        }
      } catch (e) {
        return res.json({ success: 401, msg: "Unauthorized request" });
      }
    }
  } else {
    return res.json({ success: 401, msg: "Unauthorized Request" });
  }
};

exports.checkUserId = (req, res, next) => {
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) {
      req.userId = 0;
    } else {
      token = token.split(" ")[1];
      if (token === "null") {
        req.userId = 0;
      } else {
        try {
          let payload = jwt.verify(token, authKey);
          if (!payload) {
            req.userId = 0;
          } else {
            req.userId =
              payload.WigrNvGUomqlDeK == "PcOIFafa23809UasILfaPOsfnfaoISF2"
                ? payload.secret
                : 0;
          }
        } catch (e) {
          req.userId = 0;
        }
      }
    }
  } else {
    req.userId = 0;
  }
  next();
};

exports.originMiddle = (req, res, next) => {
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    next();
  } else {
    return res.json({ success: 401, msg: "Unauthorized Request" });
  }
};

exports.checkRefer = function (refId, callback) {
  if (refId != "") {
    users
      .find({ refer_id: refId })
      .countDocuments()
      .exec(function (err, res) {
        if (res) {
          callback(1);
        } else {
          callback(0);
        }
      });
  } else {
    callback(1);
  }
};

referId = exports.referId = function (callback) {
  let text = "";
  let possible = "123456789";
  for (let i = 0; i < 10; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  users
    .find({ refer_id: text })
    .countDocuments()
    .exec(function (err, res) {
      if (res) {
        return referId(callback);
      } else {
        return callback(text);
      }
    });
};
