let jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const async = require("async");
const cron = require("node-cron");
var Client = require("node-rest-client").Client;
var restCli = new Client();

// exports.getUrl = "http://localhost:1201/";

exports.getQrUrl =
  "https://chart.googleapis.com/chart?chs=168x168&chld=M|0&cht=qr&chl=";

//schemas
const users = require("../model/users");
const wallet = require("../model/userWallet");
const cloudinary = require("./cloudinary");
const endecrypt = require("./encrypt");

const betHistory = require("../model/bet_history");
const currencyData = require("../model/currency");
const vipLvl = require("../model/vip_level");

// const balUpdate = require('../model/balUpdates');;

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

exports.getUrl = function () {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV == "development") {
    var url = "https://bc-game-seven.vercel.app/";
  } else {
    var url = "https://bc-game-seven.vercel.app/";
  }
  return url;
};

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

exports.firstNewMail = function (email) {
  return email.substr(0, 5);
};

exports.secondNewMail = function (email) {
  return email.substr(5);
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

exports.randomPass = function (len) {
  let text = "";
  let possible =
    "!@#$%&*ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  for (let i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

updateUserBalance = exports.updateUserBalance = async function (
  userId,
  curr,
  amount
) {
  var balance = await wallet
    .updateOne(
      { user_id: mongoose.mongo.ObjectId(userId), "wallet.currency": curr },
      { $set: { "wallet.$.amount": +parseFloat(amount).toFixed(6) } },
      { multi: true }
    )
    .exec();
  return balance;

  /*wallet.updateOne({user_id:mongoose.mongo.ObjectId(userId), "wallet.currency":curr},{"$set":{"wallet.$.amount": +parseFloat(amount).toFixed(6)}}, {multi:true}).exec(function(balErr,balRes){
    if(balRes){
      return balRes;
    } else {
      return false;
    }
  });*/
};

exports.getUsername = async function (userId) {
  var username = await users
    .findOne({ _id: mongoose.mongo.ObjectId(userId) })
    .exec();
  return username.username;

  /*users.findOne({_id:mongoose.mongo.ObjectId(userId)}).exec(function(err,res){
    if(res){
      return res.username;
    } else {
      return false;
    }
  });*/
};

exports.updateAdminBalance = function (curr, amount) {
  wallet
    .updateOne(
      { type: "Admin", "wallet.currency": curr },
      { $set: { "wallet.$.amount": +parseFloat(amount).toFixed(6) } },
      { multi: true }
    )
    .exec(function (balErr, balRes) {
      if (balRes) {
        return balRes;
      } else {
        return false;
      }
    });
};

exports.checkBalUpdates = function (userId, curr, fromBal, toBal, action) {
  let balObj = {
    user_id: mongoose.mongo.ObjectId(userId),
    currency: curr,
    old_bal: parseFloat(fromBal),
    new_bal: parseFloat(toBal),
    action: action,
  };
  // balUpdate.create(balObj, function(upErr, upRes) { });
  return true;
};

const findUserBalance = (exports.findUserBalance = (userId, curr, callback) => {
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
});

exports.findAdminBal = (curr, callback) => {
  wallet
    .findOne({ type: "Admin" }, { wallet: { $elemMatch: { currency: curr } } })
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
    var amount = 0;
    var status = 1;
    var obj = {
      currency: curr,
      amount: amount,
      status: status,
    };
    if (curr == "JBC") {
      obj.amount = 10000;
      obj.status = 0;
      obj.locked = 0;
    }
    wal.wallet.push(obj);
    if (i == len) {
      callback(wal);
    }
    i = i + 1;
  });
};

exports.gamecount = (data, id, callback) => {
  var i = 1;
  var len = data.length;
  var counts = [];
  data.forEach((val) => {
    // counts.push({"name":val.game_name,"total_count":0,"total_win":0,"total_loss" :0,"Wages":0,"RGC":0,"BNB":0,"BUSDT":0});
    counts.push({
      name: val.game_name,
      total_count: 0,
      total_win: 0,
      total_loss: 0,
      Wages: 0,
      RGC: 0,
      RGC_win: 0,
      RGC_betamt: 0,
      BNB: 0,
      BNB_win: 0,
      BNB_betamt: 0,
      BUSD: 0,
      BUSD_win: 0,
      BUSD_betamt: 0,
      JBC: 0,
      JB_win: 0,
      JB_betamt: 0,
    });
    if (i == len) {
      users
        .updateOne({ _id: mongoose.mongo.ObjectId(id) }, { gamecount: counts })
        .exec(function (err, resp) {
          if (resp) {
            callback(1);
          } else {
            callback(null);
          }
        });
    }
    i = i + 1;
  });
};

exports.wagecount = (data, id, callback) => {
  var i = 1;
  var len = data.length;
  var counts = [];
  data.forEach((val) => {
    counts.push({ currencyName: val.currency, wageres: 0, profit: 0 });
    if (i == len) {
      users
        .updateOne({ _id: mongoose.mongo.ObjectId(id) }, { wagered: counts })
        .exec(function (err, resp) {
          if (resp) {
            callback(1);
          } else {
            callback(null);
          }
        });
    }
    i = i + 1;
  });
};

exports.wagecountUpdate = (
  currency,
  userId,
  betamt,
  amt,
  status,
  game,
  callback
) => {
  var amount = status == "winner" ? amt : 0;
  var storeData = [];
  var marketPrc;
  currencyData
    .findOne({ currency: currency }, { market_price: 1, _id: 0 })
    .exec(function (erCurr, resCurr) {
      if (resCurr) {
        marketPrc = amount * resCurr.market_price;
        var rgc = currency == "RGC" ? marketPrc : 0;
        var bnb = currency == "BNB" ? marketPrc : 0;
        var busd = currency == "BUSD" ? marketPrc : 0;
        var jb = currency == "JBC" ? marketPrc : 0;

        var rgcBet = currency == "RGC" ? betamt : 0;
        var bnbBet = currency == "BNB" ? betamt : 0;
        var busdBet = currency == "BUSD" ? betamt : 0;
        var jbBet = currency == "JBC" ? betamt : 0;

        users.findOne(
          { _id: userId, "gamecount.name": game },
          { gamecount: 1, _id: 1, wagered: 1, vip: 1 },
          async function (err, doc) {
            /*var condata = 0;
        var userwages= await users.aggregate([
          {'$match': {'_id': mongoose.mongo.ObjectId(userId)}}, 
          {'$unwind': '$gamecount'}, 
          {'$group': {'_id': null, 'Wages': {'$sum': '$gamecount.Wages'}}}
        ]).then((data)=>{
          if(data){ condata = data[0].Wages;
          }else{ condata = 0 }
        })
        vipLvl.find({'XP': {$lte:condata}}).sort({'XP': -1 }).exec(async function(viperr, vipRes){
          if(vipRes){}
        })
        if(status == 'winner'){
          if(vipRes.length == 0){var vipdb = 'VIP 0'}
          else{var vipdb = vipRes[0].level};
          if(doc !== null){
            if(vipdb == doc.vip){
              var vip = vipdb;
            }else{
              var vip = vipdb;
              var VIPlvl = vipRes.filter(val => val.level == doc.vip);
              if(VIPlvl.length !== 0){
                var grtlen =  VIPlvl[0].XP;
                var lesslen =  vipRes[0].XP;
              }else{
                var grtlen =  0;
                var lesslen =  vipRes[vipRes.length-1].XP;
              }
              vipLvl.aggregate([
                  {'$match': {'XP': {'$gt': grtlen, '$lte': lesslen}}},
                  {'$group': {'_id': null, 'Bonus': {'$sum': '$XP'}}}
                ]).then((data1)=>{
                if(data1){
                  var bonus = (data1[0].Bonus == undefined) ? 0 : data1[0].Bonus;
                  findUserBalance(userId, 'RGC', async function(userBalance){
                    var updated_balance = (userBalance*1)+(bonus*1);
                    updateUserBalance(userId, 'RGC', updated_balance);
                  })
                }
              })
            }
          }
        }*/
            if (doc) {
              if (currency != "JBC") {
                users.updateOne(
                  { _id: userId, "gamecount.name": game },
                  {
                    $inc: { "gamecount.$.Wages": Number(marketPrc.toFixed(4)) },
                  },
                  async (ers1, doc1) => {
                    var updatesCnt = await users
                      .updateOne(
                        { _id: userId, "gamecount.name": game },
                        {
                          $inc: {
                            "gamecount.$.BNB": Number((bnb * 1).toFixed(4)),
                            "gamecount.$.BUSD": Number((busd * 1).toFixed(4)),
                            "gamecount.$.RGC": Number((rgc * 1).toFixed(4)),
                            "gamecount.$.BNB_betamt": Number(bnbBet * 1),
                            "gamecount.$.BUSD_betamt": Number(busdBet * 1),
                            "gamecount.$.RGC_betamt": Number(rgcBet * 1),
                          },
                        }
                      )
                      .exec();
                    if (doc1) {
                      users.updateOne(
                        { _id: userId, "wagered.currencyName": currency },
                        {
                          $inc: {
                            "wagered.$.wageres": Number(betamt),
                            "wagered.$.profit": Number(marketPrc.toFixed(4)),
                          },
                        },
                        (urerr, usrupd) => {
                          if (usrupd) {
                            if (usrupd.modifiedCount !== 0) {
                              GiveVIPBonus(userId);
                              return callback(1);
                            } else {
                              users
                                .updateOne(
                                  { _id: mongoose.mongo.ObjectId(userId) },
                                  {
                                    $push: {
                                      wagered: {
                                        currencyName: currency,
                                        wageres: Number(betamt * 1),
                                        profit: Number(marketPrc.toFixed(4)),
                                      },
                                    },
                                  }
                                )
                                .exec(function (wageErr, wageRes) {
                                  if (wageRes) {
                                    GiveVIPBonus(userId);
                                    return callback(1);
                                  } else {
                                    return callback(0);
                                  }
                                });
                            }
                          } else {
                            return callback(0);
                          }
                        }
                      );
                    } else {
                      return callback(0);
                    }
                  }
                );
              } else {
                users.updateOne(
                  { _id: userId, "wagered.currencyName": currency },
                  {
                    $inc: {
                      "wagered.$.wageres": Number(betamt),
                      "wagered.$.profit": amount,
                    },
                  },
                  async (erss2, docs2) => {
                    if (docs2) {
                      var updatesFnc = await users
                        .updateOne(
                          { _id: userId, "gamecount.name": game },
                          {
                            $inc: {
                              "gamecount.$.JBC": Number(amount.toFixed(4)),
                              "gamecount.$.JB_betamt": Number(jbBet),
                            },
                          }
                        )
                        .exec();
                      return callback(1);
                    } else {
                      callback(0);
                    }
                  }
                );
              }
            } else {
              users.findOne(
                { _id: userId },
                { gamecount: 1, _id: 1, wagered: 1 },
                function (errRes, docRes) {
                  storeData = docRes.gamecount;
                  storeData.push({
                    name: game,
                    total_count: 0,
                    total_win: 0,
                    total_loss: 0,
                    Wages: 0,
                    RGC: 0,
                    RGC_win: 0,
                    RGC_betamt: 0,
                    BNB: 0,
                    BNB_win: 0,
                    BNB_betamt: 0,
                    BUSD: 0,
                    BUSD_win: 0,
                    BUSD_betamt: 0,
                    JBC: 0,
                    JB_win: 0,
                    JB_betamt: 0,
                  });
                  users
                    .updateOne(
                      { _id: userId },
                      { $set: { gamecount: storeData } }
                    )
                    .exec(function (upderr, updres) {
                      if (updres) {
                        users.findOne(
                          { _id: userId, "gamecount.name": game },
                          { gamecount: 1, _id: 1, wagered: 1 },
                          function (usrerr, usrdoc) {
                            if (usrdoc) {
                              if (currency != "JBC") {
                                users.updateOne(
                                  { _id: userId, "gamecount.name": game },
                                  {
                                    $inc: {
                                      "gamecount.$.Wages": Number(
                                        marketPrc.toFixed(4)
                                      ),
                                    },
                                  },
                                  async (ers1, doc1) => {
                                    var updatesCnt = await users
                                      .updateOne(
                                        { _id: userId, "gamecount.name": game },
                                        {
                                          $inc: {
                                            "gamecount.$.BNB": Number(
                                              (bnb * 1).toFixed(4)
                                            ),
                                            "gamecount.$.BUSD": Number(
                                              (busd * 1).toFixed(4)
                                            ),
                                            "gamecount.$.RGC": Number(
                                              (rgc * 1).toFixed(4)
                                            ),
                                            "gamecount.$.BNB_betamt": Number(
                                              (bnbBet * 1).toFixed(4)
                                            ),
                                            "gamecount.$.BUSD_betamt": Number(
                                              (busdtBet * 1).toFixed(4)
                                            ),
                                            "gamecount.$.RGC_betamt": Number(
                                              rgcBet * 1
                                            ),
                                          },
                                        }
                                      )
                                      .exec();
                                    if (doc1) {
                                      users.updateOne(
                                        {
                                          _id: userId,
                                          "wagered.currencyName": currency,
                                        },
                                        {
                                          $inc: {
                                            "wagered.$.wageres": Number(betamt),
                                            "wagered.$.profit": Number(
                                              marketPrc.toFixed(4)
                                            ),
                                          },
                                        },
                                        (urerr, usrupd) => {
                                          if (usrupd) {
                                            if (usrupd.modifiedCount !== 0) {
                                              GiveVIPBonus(userId);
                                              return callback(1);
                                            } else {
                                              users
                                                .updateOne(
                                                  {
                                                    _id: mongoose.mongo.ObjectId(
                                                      userId
                                                    ),
                                                  },
                                                  {
                                                    $push: {
                                                      wagered: {
                                                        currencyName: currency,
                                                        wageres: Number(
                                                          betamt * 1
                                                        ),
                                                        profit: Number(
                                                          marketPrc.toFixed(4)
                                                        ),
                                                      },
                                                    },
                                                  }
                                                )
                                                .exec(function (
                                                  wageErr,
                                                  wageRes
                                                ) {
                                                  if (wageRes) {
                                                    GiveVIPBonus(userId);
                                                    return callback(1);
                                                  } else {
                                                    return callback(0);
                                                  }
                                                });
                                            }
                                          } else {
                                            return callback(0);
                                          }
                                        }
                                      );
                                    } else {
                                      return callback(0);
                                    }
                                  }
                                );
                              } else {
                                users.updateOne(
                                  {
                                    _id: userId,
                                    "wagered.currencyName": currency,
                                  },
                                  {
                                    $inc: {
                                      "wagered.$.wageres": Number(betamt),
                                      "wagered.$.profit": amount,
                                    },
                                  },
                                  async (erss2, docs2) => {
                                    if (docs2) {
                                      var updatesFnc = await users
                                        .updateOne(
                                          {
                                            _id: userId,
                                            "gamecount.name": game,
                                          },
                                          {
                                            $inc: {
                                              "gamecount.$.JBC": Number(
                                                amount.toFixed(4)
                                              ),
                                              "gamecount.$.JB_betamt": Number(
                                                jbBet.toFixed(4)
                                              ),
                                            },
                                          }
                                        )
                                        .exec();
                                      return callback(1);
                                    } else {
                                      callback(0);
                                    }
                                  }
                                );
                              }
                            } else {
                              return callback(0);
                            }
                          }
                        );
                      } else {
                        return callback(0);
                      }
                    });
                }
              );
            }
          }
        );
      } else {
        return callback(0);
      }
    });
};

exports.gamecountUpdate = (userId, game, status, currency, callback) => {
  var rgc = currency == "RGC" ? 1 : 0;
  var bnb = currency == "BNB" ? 1 : 0;
  var busd = currency == "BUSD" ? 1 : 0;
  var jb = currency == "JBC" ? 1 : 0;
  if (status == "winner") {
    users.updateOne(
      { _id: userId, "gamecount.name": game },
      {
        $inc: {
          "gamecount.$.total_win": 1,
          "gamecount.$.RGC_win": rgc,
          "gamecount.$.BNB_win": bnb,
          "gamecount.$.BUSD_win": busd,
          "gamecount.$.JB_win": jb,
        },
      },
      (error, result) => {
        if (error) {
          callback(0);
        } else {
          callback(1);
        }
      }
    );
  } else {
    users.updateOne(
      { _id: userId, "gamecount.name": game },
      { $inc: { "gamecount.$.total_loss": 1 } },
      (ers1, doc1) => {
        if (doc1) {
          callback(1);
        } else {
          callback(0);
        }
      }
    );
  }
};

exports.createPayload = (key) => {
  let payload = {
    secret: key,
    WigrNvGUomqlDeK: "PcOIFafa23809UasILfaPOsfnfaoISF2",
  };
  let token = jwt.sign(payload, authKey, { expiresIn: 180 * 60 });
  return token;
};

exports.updateUserseed = (userId, serverSeed, game) => {
  betHistory
    .updateMany(
      { user_id: userId, server_seed: serverSeed, game: game },
      { $set: { seed_status: 1 } }
    )
    .exec(function (err, resp) {
      if (err) {
        return 0;
      }
      if (resp) {
        return 1;
      }
    });
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
  "http://192.168.1.82",
  "http://localhost:4200",
  "http://localhost:5173",
  "http://localhost:1201",
  "https://rollgame.io",
  "http://192.168.1.110:1201",
  "https://bc-game-seven.vercel.app",
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
    return res.json({ success: 401, error: "please login to continue" });
  }
};

exports.tokenMiddleware = (req, res, next) => {
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) {
      return res.json({ success: 401, msg: "please login to continue" });
    }
    token = token.split(" ")[1];
    if (token === "null") {
      return res.json({ success: 401, msg: "please login to continue" });
    } else {
      try {
        let payload = jwt.verify(token, authKey);
        if (!payload) {
          return res.json({ success: 401, msg: "please login to continue" });
        }
        if (payload.WigrNvGUomqlDeK == "PcOIFafa23809UasILfaPOsfnfaoISF2") {
          req.userId = payload.secret;
          next();
        } else {
          return res.json({ success: 401, msg: "please login to continue" });
        }
      } catch (e) {
        return res.json({ success: 401, msg: "please login to continue" });
      }
    }
  } else {
    return res.json({ success: 401, msg: "please login to continue" });
  }
};

exports.userVerify = (req, res, next) => {
  /*req.userId = '6325bb8bb9b7985fd0b92763';
  next();*/
  let origin = req.headers["origin"];
  let index = orgArrVal.indexOf(origin);
  if (index > -1) {
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) {
      return res.json({ success: 401, msg: "please login to continue" });
    }
    token = token.split(" ")[1];
    if (token === "null") {
      return res.json({ success: 401, msg: "please login to continue" });
    } else {
      try {
        let payload = jwt.verify(token, authKey);
        if (!payload) {
          return res.json({ success: 401, msg: "please login to continue" });
        }
        if (payload.WigrNvGUomqlDeK == "PcOIFafa23809UasILfaPOsfnfaoISF2") {
          req.userId = payload.secret;
          next();
        } else {
          return res.json({ success: 401, msg: "please login to continue" });
        }
      } catch (e) {
        return res.json({ success: 401, msg: "please login to continue" });
      }
    }
  } else {
    return res.json({ success: 401, msg: "please login to continue" });
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
    return res.json({ success: 401, msg: "please login to continue" });
  }
};

exports.checkRefer = function (refId, callback) {
  if (refId && refId != "") {
    users
      .find({ referr_id: refId })
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

uniqueName = exports.uniqueName = function (callback) {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 11; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  users
    .find({ username: text })
    .countDocuments()
    .exec(function (err, res) {
      if (res) {
        return uniqueName(callback);
      } else {
        return callback(text);
      }
    });
};

exports.updategameCount = function (userId, game, status, callback) {
  var userId = id;
  users.updateOne(
    { _id: id, "gamecount.name": game },
    { $inc: { "gamecount.$.total_count": 1 } },
    (ers, doc) => {
      if (doc) {
        if (status == "winner") {
          users.updateOne(
            { _id: id, "gamecount.name": game },
            { $inc: { "gamecount.$.total_win": 1 } },
            (ers1, doc1) => {
              if (doc1) {
                return callback(1);
              } else {
                return callback(2);
              }
            }
          );
        } else {
          users.updateOne(
            { _id: id, "gamecount.name": game },
            { $inc: { "gamecount.$.total_loss": 1 } },
            (ers1, doc1) => {
              if (doc1) {
                return callback(1);
              } else {
                return callback(2);
              }
            }
          );
        }
      } else {
        return callback(0);
      }
    }
  );
};

exports.getcount = function (userid, callback) {
  users
    .aggregate([
      { $match: { _id: mongoose.mongo.ObjectId(userid) } },
      { $unwind: { path: "$gamecount" } },
      {
        $setWindowFields: {
          sortBy: { "gamecount.Wages": -1 },
          output: { "gamecount.rank": { $rank: {} } },
        },
      },
      {
        $lookup: {
          from: "gameList",
          localField: "gamecount.name",
          foreignField: "game_name",
          as: "string",
        },
      },
      // {'$limit': 3},
      { $unwind: { path: "$string" } },
      {
        $group: {
          _id: "$_id",
          gamecount: {
            $push: {
              name: "$gamecount.name",
              count: "$gamecount.total_count",
              win: "$gamecount.total_win",
              loss: "$gamecount.total_lose",
              wages: "$gamecount.Wages",
              rank: "$gamecount.rank",
              img: "$string.image",
            },
          },
          played: { $sum: "$gamecount.total_count" },
          wins: { $sum: "$gamecount.total_win" },
          joined: { $first: "$created_at" },
        },
      },
    ])
    .exec(function (err, resp) {
      if (resp) {
        callback(resp);
      }
      if (err) {
        console.log(err);
        callback(0);
      }
    });
};

exports.reelrange = function (range, value, callback) {
  let rangeIndex = -1;
  for (let i = 0; i < range.length; i++) {
    const [min1, max1] = range[i];
    if (value >= min1 && value <= max1) {
      rangeIndex = i;
      break;
    }
  }

  return rangeIndex;
};

exports.catspin = function (value, callback) {
  var result = value * 5125;
  var spin = Math.floor(result);

  const range = [
    [0, 25],
    [25, 75],
    [75, 150],
    [150, 275],
    [275, 525],
    [525, 825],
    [825, 1125],
    [1125, 1625],
    [1625, 2125],
    [2125, 2625],
    [2625, 3125],
    [3125, 5125],
  ];

  let rangeIndex = -1;

  for (let i = 0; i < range.length; i++) {
    const [mins, maxs] = range[i];
    if (spin >= mins && spin <= maxs) {
      rangeIndex = i;
      break;
    }
  }

  return rangeIndex;
};

exports.sendGameResult = function (resData) {
  users
    .findOne(
      { _id: mongoose.mongo.ObjectId(resData.user_id) },
      { username: 1, _id: 0 }
    )
    .exec(function (usererr, userData) {
      var socData = [];
      var obj = {
        betid: resData._id,
        player: userData.username,
        bet_amount: resData.bet_amount,
        time: resData.created_at,
        payout: resData.payout,
        status: resData.status,
        win_lose_amt: resData.win_lose_amt,
        currency: resData.currency,
        game: resData.game,
      };
      socData.push(obj);
      socket.sockets.emit("getgameData", socData);
    });
};

GiveVIPBonus = exports.GiveVIPBonus = function (userid) {
  currencyData
    .find({}, { _id: 0, currency: 1, market_price: 1 })
    .exec((err, resData) => {
      var WageRGC = resData.filter((val) => val.currency == "RGC");
      var WageBNB = resData.filter((val) => val.currency == "BNB");
      var WageBUSD = resData.filter((val) => val.currency == "BUSD");
      var WageJB = resData.filter((val) => val.currency == "JBC");
      var wage = {
        RGC: WageRGC[0].market_price,
        BNB: WageBNB[0].market_price,
        BUSD: WageBUSD[0].market_price,
        JBC: WageJB[0].market_price,
      };
      users
        .aggregate([
          { $match: { _id: mongoose.mongo.ObjectId(userid) } },
          { $unwind: { path: "$wagered" } },
          { $project: { "wagered.currencyName": 1, "wagered.profit": 1 } },
          {
            $group: {
              _id: "$wagered.currencyName",
              totalProfit: { $sum: "$wagered.profit" },
            },
          },
          {
            $addFields: {
              convertedTotal: {
                $add: [
                  {
                    $cond: [
                      { $eq: ["$_id", "BNB"] },
                      { $multiply: ["$totalProfit", wage.BNB] },
                      0,
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ["$_id", "BUSD"] },
                      { $multiply: ["$totalProfit", wage.BUSD] },
                      0,
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ["$_id", "RGC"] },
                      { $multiply: ["$totalProfit", wage.RGC] },
                      0,
                    ],
                  },
                ],
              },
            },
          },
          { $group: { _id: null, finalTotal: { $sum: "$convertedTotal" } } },
        ])
        .exec(function (err, resData) {
          if (resData.length !== 0) {
            var wagerd = resData[0].finalTotal;
            users.findOne(
              { _id: userid },
              { gamecount: 1, _id: 1, wagered: 1, vip: 1 },
              async function (err, doc) {
                vipLvl
                  .find({ XP: { $lte: wagerd } })
                  .sort({ XP: -1 })
                  .exec(async function (viperr, vipRes) {
                    if (vipRes) {
                      if (vipRes.length == 0) {
                        var vipdb = "VIP 0";
                      } else {
                        var vipdb = vipRes[0].level;
                      }
                      if (doc !== null) {
                        if (vipdb == doc.vip) {
                          var vip = vipdb;
                        } else {
                          var vip = vipdb;
                          var VIPlvl = vipRes.filter(
                            (val) => val.level == doc.vip
                          );
                          if (VIPlvl.length !== 0) {
                            var grtlen = VIPlvl[0].XP;
                            var lesslen = vipRes[0].XP;
                          } else {
                            var grtlen = 0;
                            var lesslen = vipRes[vipRes.length - 1].XP;
                          }
                          vipLvl
                            .aggregate([
                              {
                                $match: { XP: { $gt: grtlen, $lte: lesslen } },
                              },
                              { $group: { _id: null, Bonus: { $sum: "$XP" } } },
                            ])
                            .then((data1) => {
                              if (data1) {
                                var bonus =
                                  data1[0].Bonus == undefined
                                    ? 0
                                    : data1[0].Bonus;
                                findUserBalance(
                                  userid,
                                  "RGC",
                                  async function (userBalance) {
                                    var updated_balance =
                                      userBalance * 1 + bonus * 1;
                                    updateUserBalance(
                                      userid,
                                      "RGC",
                                      updated_balance
                                    );
                                    users
                                      .updateOne(
                                        { _id: userid },
                                        { $set: { vip: vip } }
                                      )
                                      .exec();
                                  }
                                );
                              }
                            });
                        }
                      }
                    }
                  });
              }
            );
          }
        });
    });
};

GetTotalWager = exports.GetTotalWager = function (userid, callback) {
  currencyData
    .find({}, { _id: 0, currency: 1, market_price: 1 })
    .exec((err, resData) => {
      var WageRGC = resData.filter((val) => val.currency == "RGC");
      var WageBNB = resData.filter((val) => val.currency == "BNB");
      var WageBUSD = resData.filter((val) => val.currency == "BUSD");
      var WageJB = resData.filter((val) => val.currency == "JBC");
      var wage = {
        RGC: WageRGC[0].market_price,
        BNB: WageBNB[0].market_price,
        BUSD: WageBUSD[0].market_price,
        JBC: WageJB[0].market_price,
      };
      users
        .aggregate([
          { $match: { _id: mongoose.mongo.ObjectId(userid) } },
          { $unwind: { path: "$wagered" } },
          { $project: { "wagered.currencyName": 1, "wagered.profit": 1 } },
          {
            $group: {
              _id: "$wagered.currencyName",
              totalProfit: { $sum: "$wagered.profit" },
            },
          },
          {
            $addFields: {
              convertedTotal: {
                $add: [
                  {
                    $cond: [
                      { $eq: ["$_id", "BNB"] },
                      { $multiply: ["$totalProfit", wage.BNB] },
                      0,
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ["$_id", "BUSD"] },
                      { $multiply: ["$totalProfit", wage.BUSD] },
                      0,
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ["$_id", "RGC"] },
                      { $multiply: ["$totalProfit", wage.RGC] },
                      0,
                    ],
                  },
                ],
              },
            },
          },
          { $group: { _id: null, finalTotal: { $sum: "$convertedTotal" } } },
        ])
        .exec(function (err, resData) {
          if (resData.length !== 0) {
            var wagerd = resData[0].finalTotal;
            callback(wagerd);
          } else {
            callback(0);
          }
        });
    });
};
