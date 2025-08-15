const express = require("express");
const router = express.Router();
const async = require("async");
const mongoose = require("mongoose");
const moment = require("moment");
const ipInfo = require("ipinfo");
const useragent = require("useragent");
const validator = require("validator");
const encdec = require("../../helpers/newendecryption");
const helpingLib = require("../../helpers/common");
const users = require("../../model/users");
const deposit = require("../../model/deposit");
const withdraw = require("../../model/withdraw");
const currency = require("../../model/currency");
const wallet = require("../../model/userWallet");
const contact = require("../../model/contactUs");

const betHistory = require("../../model/bet_history");
const coinhistory = require("../../model/coinflip_bethis");
const wheelhistory = require("../../model/wheel_result");
const fortune = require("../../model/wheeloffortune");
const cave = require("../../model/cave_bethistory");
const keno = require("../../model/keno_bet_history");
const roulette = require("../../model/roulette_bethistory");
const mines = require("../../model/mines_bethistory");
const support = require("../../model/support");
const plinko = require("../../model/plinko_bethistory");
const crash = require("../../model/crash_bethistory");

let response = {};

let updatedDate = () => {
  return new Date();
};

router.get("/testurl", function (req, res) {
  res.json({ success: 1, msg: "test url" });
});
/* GET users listing. */
router.post("/userlist", helpingLib.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? -1 : 1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");
  // search
  var search = {};

  var start = "";
  if (info.startDate != "") {
    if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var startDate = new Date(info.startDate);
      startDate.setDate(startDate.getDate() + 1);
      start = startDate.toISOString();
    }
  }
  var end = "";
  if (info.endDate != "") {
    if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var endDate = new Date(info.endDate);
      endDate.setDate(endDate.getDate() + 1);
      end = endDate.toISOString();
    }
  }

  if (start != "" && end != "") {
    search["$or"] = [
      { created_at: { $gte: new Date(start), $lt: new Date(end) } },
    ];
  }
  search = {};
  async.parallel(
    {
      usersCount: function (cb) {
        users.find(search).countDocuments().exec(cb);
      },
      usersData: function (cb) {
        users
          .find(
            search,
            {
              _id: 1,
              username: 1,
              luck_value: 1,
              added_value: 1,
              status: 1,
              created_at: 1,
              kyc_status: 1,
              tfa_status: 1,
            },
            query
          )
          .sort({ date: -1 })
          .exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      emailConcat(results.usersData, function (resData) {
        response.status = true;
        response.data = resData;
        response.userCount = results.usersCount - 1;
        res.json(response);
      });
    }
  );
});

function emailConcat(data, callback) {
  var len = data.length;
  var i = 1;
  var userData = [];
  data.forEach((val) => {
    var obj = {
      userId: encdec.encryptNew(val._id.toString()),
      username: val.username,
      status: val.status,
      created_at: val.created_at,
      kyc_status: val.kyc_status,
      tfa_status: val.tfa_status,
      email:
        encdec.decryptNew(val.luck_value) + encdec.decryptNew(val.added_value),
    };
    userData.push(obj);
    if (len == i) {
      callback(userData);
    }
    i = i + 1;
  });
}

router.post(
  "/withdrawdata",
  helpingLib.originMiddle,
  function (req, res, next) {
    var info = req.body;
    var filter = info.filter || "";
    var pageNo = parseInt(info.pageIndex) || 0;
    var sortOrder = info.sortOrder;
    var size = parseInt(info.pageSize);
    var sortName = info.sortActive;
    var srt = {};
    srt[sortName] = sortOrder == "desc" ? -1 : 1;
    var query = {};
    query.sort = srt;
    query.skip = size * pageNo;
    query.limit = size;
    var regex = new RegExp(filter, "i");
    // search
    var search = {};

    var start = "";
    if (info.startDate != "") {
      if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
        var startDate = new Date(info.startDate);
        startDate.setDate(startDate.getDate() + 1);
        start = startDate.toISOString();
      }
    }
    var end = "";
    if (info.endDate != "") {
      if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
        var endDate = new Date(info.endDate);
        endDate.setDate(endDate.getDate() + 1);
        end = endDate.toISOString();
      }
    }

    if (start != "" && end != "") {
      search["$or"] = [
        { created_at: { $gte: new Date(start), $lt: new Date(end) } },
      ];
    }

    async.parallel(
      {
        userCount: function (cb) {
          withdraw.find(search).countDocuments().exec(cb);
        },
        userData: function (cb) {
          withdraw
            .find(search, { _id: 0 }, query)
            .sort({ created_at: -1 })
            .exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        response.status = true;
        response.data = results.userData;
        response.userCount = results.userCount - 1;
        res.json(response);
      }
    );
  }
);

router.post("/depositdata", helpingLib.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? -1 : 1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");
  // search
  var search = {};

  var start = "";
  if (info.startDate != "") {
    if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var startDate = new Date(info.startDate);
      startDate.setDate(startDate.getDate() + 1);
      start = startDate.toISOString();
    }
  }
  var end = "";
  if (info.endDate != "") {
    if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var endDate = new Date(info.endDate);
      endDate.setDate(endDate.getDate() + 1);
      end = endDate.toISOString();
    }
  }

  if (start != "" && end != "") {
    search["$or"] = [
      { created_at: { $gte: new Date(start), $lt: new Date(end) } },
    ];
  }
  async.parallel(
    {
      userCount: function (cb) {
        deposit.find(search).countDocuments().exec(cb);
      },
      userData: function (cb) {
        deposit
          .find(search, { _id: 0 }, query)
          .sort({ created_at: -1 })
          .exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      response.status = true;
      response.data = results.userData;
      response.userCount = results.userCount - 1;
      res.json(response);
    }
  );
});

router.post(
  "/contactUsData",
  helpingLib.originMiddle,
  function (req, res, next) {
    var info = req.body;
    var filter = info.filter || "";
    var pageNo = parseInt(info.pageIndex) || 0;
    var sortOrder = info.sortOrder;
    var size = parseInt(info.pageSize);
    var sortName = info.sortActive;
    var srt = {};
    srt[sortName] = sortOrder == "desc" ? -1 : 1;
    var query = {};
    query.sort = srt;
    query.skip = size * pageNo;
    query.limit = size;
    var regex = new RegExp(filter, "i");

    async.parallel(
      {
        supportCount: function (cb) {
          support.find({}).countDocuments().exec(cb);
        },
        supportData: function (cb) {
          support.find({}, {}, query).sort({ created_at: -1 }).exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        response.status = true;
        response.supportData = results.supportData;
        response.supportCount = results.supportCount;
        res.json(response);
      }
    );
  }
);

router.post(
  "/get_currency",
  helpingLib.originMiddle,
  function (req, res, next) {
    var info = req.body;
    var filter = info.filter || "";
    var pageNo = parseInt(info.pageIndex) || 0;
    var sortOrder = info.sortOrder;
    var size = parseInt(info.pageSize);
    var sortName = info.sortActive;
    var srt = {};
    srt[sortName] = sortOrder == "desc" ? -1 : 1;
    var query = {};
    query.sort = srt;
    query.skip = size * pageNo;
    query.limit = size;
    var regex = new RegExp(filter, "i");
    // search
    var search = {};
    var start = "";
    if (info.startDate != "") {
      if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
        var startDate = new Date(info.startDate);
        startDate.setDate(startDate.getDate() + 1);
        start = startDate.toISOString();
      }
    }
    var end = "";
    if (info.endDate != "") {
      if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
        var endDate = new Date(info.endDate);
        endDate.setDate(endDate.getDate() + 1);
        end = endDate.toISOString();
      }
    }

    if (start != "" && end != "") {
      search["$or"] = [
        { created_at: { $gte: new Date(start), $lt: new Date(end) } },
      ];
    }
    search = {};

    async.parallel(
      {
        userCount: function (cb) {
          currency.find(search).countDocuments().exec(cb);
        },
        userData: function (cb) {
          currency.find(search, {}, query).sort({ created_at: -1 }).exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        response.status = true;
        checkUseraddres(results.userData, function (data1) {
          response.data = data1;
          response.userCount = results.userCount - 1;
          res.json(response);
        });
      }
    );
  }
);

function checkUseraddres(data, callback) {
  var length = data.length;
  var result = [];
  if (length > 0) {
    var i = 1;
    data.forEach((val) => {
      users.findOne({ _id: val.user_id }).exec(function (err, resData) {
        if (resData) {
          const currdata = {
            DW_contract: val.DW_contract,
            DW_rpc: val.DW_rpc,
            coinType: val.coinType,
            token_contract: val.token_contract,
            token_abi: val.token_abi,
            DW_abi: val.DW_abi,
            decimal: val.decimal,
            chainId: val.chainId,
            Network_api: val.Network_api,
            Network_PK: val.Network_PK,
            chainName: val.chainName,
            name: val.name,
            symbol: val.symbol,
            decimals: val.decimals,
            rpcUrls: val.rpcUrls,
            blockExplorerUrls: val.blockExplorerUrls,
            created_by: val.created_by,
            user_id: val.user_id,
            _id: val._id,
            currency: val.currency,
            network: val.network,
            connecttype: val.connecttype,
            created_at: val.created_at,
            address: resData.address,
          };
          result.push(currdata);
        } else {
          result.push(val);
        }
        if (i == length) {
          callback(result);
        }
        i = i + 1;
      });
    });
  } else {
    callback([]);
  }
}

function getUserddres(data, callback) {
  var length = data.length;
  var result = [];
  if (length > 0) {
    var i = 1;
    data.forEach((val) => {
      users.findOne({ _id: val.user_id }).exec(function (err, resData) {
        if (resData) {
          const currdata = {
            status: val.status,
            change_per: val.change_per,
            volume: val.volume,
            high: val.high,
            low: val.low,
            prc_clr: val.prc_clr,
            created_by: val.created_by,
            user_id: val.user_id,
            _id: val._id,
            from_symbol: val.from_symbol,
            to_symbol: val.to_symbol,
            trade_fee: val.trade_fee,
            last_price: val.last_price,
            min_amt: val.min_amt,
            price_range: val.price_range,
            decimal: val.decimal,
            amt_decimal: val.amt_decimal,
            created_at: val.created_at,
            updated_at: val.updated_at,
            address: resData.address,
          };
          result.push(currdata);
        } else {
          result.push(val);
        }
        if (i == length) {
          callback(result);
        }
        i = i + 1;
      });
    });
  } else {
    callback([]);
  }
}

router.post(
  "/getUser_infos",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    var encuId = encdec.decryptNew(info.UserIdData);
    users
      .findOne({ _id: mongoose.mongo.ObjectId(encuId) })
      .exec(function (error, resData) {
        if (resData) {
          async.parallel(
            {
              walletdata: function (cb) {
                wallet.findOne({ user_id: resData._id }).exec(cb);
              },
              depositData: function (cb) {
                deposit
                  .find({ user_id: resData._id }, { _id: 0 })
                  .sort({ created_at: -1 })
                  .exec(cb);
              },
              withdrawData: function (cb) {
                withdraw
                  .find({ user_id: resData._id }, { _id: 0 })
                  .sort({ created_at: -1 })
                  .exec(cb);
              },
              ReferralUser: function (cb) {
                users
                  .find(
                    { referrer_id: resData.referr_id },
                    { _id: 0, luck_value: 1, added_value: 1, created_at: 1 }
                  )
                  .sort({ created_at: -1 })
                  .exec(cb);
              },
              ReferralledUser: function (cb) {
                users
                  .findOne(
                    { referr_id: resData.referrer_id },
                    { _id: 0, luck_value: 1, added_value: 1 }
                  )
                  .sort({ created_at: -1 })
                  .exec(cb);
              },
            },
            function (err, results) {
              if (err) return res.status(500).send(err);
              if (
                resData.gamecount.length > 0 &&
                resData.gamecount !== undefined
              ) {
                var gameData = JSON.parse(JSON.stringify(resData.gamecount));
              } else {
                var gameData = [];
              }
              var userInfo = {
                username: resData.username,
                firstname: resData.firstname,
                lastname: resData.lastname,
                email:
                  encdec.decryptNew(resData.luck_value) +
                  encdec.decryptNew(resData.added_value),
                country: resData.country,
              };
              var kycInfo = {
                kyc_status: resData.kyc_status,
                id_status: resData.id_status,
                passport_status: resData.passport_status,
                residence_status: resData.residence_status,
                selfie_status: resData.selfie_status,
                profile_status: resData.profile_status,
                id_proof: resData.id_proof,
                id_proof1: resData.id_proof1,
                passport_proof: resData.passport_proof,
                selfie_proof: resData.selfie_proof,
                residence_proof: resData.residence_proof,
              };
              if (
                results.ReferralledUser == null &&
                results.ReferralledUser == undefined
              ) {
                var referraledBy = "none";
              } else {
                var referraledBy =
                  encdec.decryptNew(results.ReferralledUser.luck_value) +
                  encdec.decryptNew(results.ReferralledUser.added_value);
              }
              if (results.ReferralUser.length > 0) {
                ReferralEmail(results.ReferralUser, function (resEmail) {
                  var refferral = {
                    ReferredBy: referraledBy,
                    ReferredEmail: resEmail,
                  };
                  response.walletdata = results.walletdata?.wallet;
                  response.userdeposit = results.depositData;
                  response.userwithdraw = results.withdrawData;
                  response.userDetails = resData;
                  response.userInfo = userInfo;
                  response.kycInfo = kycInfo;
                  response.refferral = refferral;
                  response.gameData = gameData;
                  response.status = true;
                  res.json(response);
                });
              } else {
                var refferral = { ReferredBy: referraledBy, ReferredEmail: [] };
                response.walletdata = results.walletdata?.wallet;
                response.userdeposit = results.depositData;
                response.userwithdraw = results.withdrawData;
                response.userDetails = resData;
                response.userInfo = userInfo;
                response.refferral = refferral;
                response.kycInfo = kycInfo;
                response.gameData = gameData;
                response.status = true;
                res.json(response);
              }
            }
          );
        } else {
          response.status = true;
          response.msg = "Something wents wrong !";
          res.json(response);
        }
      });
  }
);

function ReferralEmail(data, callback) {
  var len = data.length;
  var i = 1;
  var userData = [];
  data.forEach((val) => {
    var obj = {
      email:
        encdec.decryptNew(val.luck_value) + encdec.decryptNew(val.added_value),
      created_at: val.created_at,
    };
    userData.push(obj);
    if (len == i) {
      callback(userData);
    }
    i = i + 1;
  });
}

router.post(
  "/getDepositInfo",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    var trx = info.TransactionHash;
    deposit
      .findOne({ reference_no: trx }, { _id: 0 })
      .exec(function (userErr, userRes) {
        if (userRes) {
          res.json({ status: 1, depositeData: userRes });
        } else {
          res.json({ status: 0, msg: "deposite undefined" });
        }
      });
  }
);

router.post(
  "/getWithdrawInfo",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    // var trx = info.TransactionHash;
    withdraw
      .findOne({ CIdKey: info.CIdKey }, { _id: 0 })
      .exec(function (userErr, userRes) {
        if (userRes) {
          res.json({ status: 1, withdrawData: userRes });
        } else {
          res.json({ status: 0, msg: "withdraw undefined" });
        }
      });
  }
);

router.post(
  "/getCurrencyInfo",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    var Id = info.id;
    currency
      .findOne({ _id: mongoose.mongo.ObjectId(Id) }, { _id: 0 })
      .exec(function (userErr, userRes) {
        if (userRes) {
          res.json({ status: 1, CurrData: userRes });
        } else {
          res.json({ status: 0, msg: "Pair undefined1" });
        }
      });
  }
);

router.post(
  "/getsupportInfo",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    Id = info.Id;
    support
      .findOne({ _id: mongoose.mongo.ObjectId(Id) })
      .exec(function (err, contactInfo) {
        if (contactInfo) {
          res.json({ status: 1, contactInfo: contactInfo });
        } else {
          res.json({ status: 0, msg: "Something wents wrong " });
        }
      });
  }
);

router.post("/status", helpingLib.originMiddle, (req, res) => {
  let info = req.body;
  let sts = info.status == 1 ? 2 : 1;
  let obj = { status: sts, modifiedDate: updatedDate() };
  var encuId = encdec.encryptNew(info._id.toString());
  users
    .findOneAndUpdate({ _id: info._id }, { $set: obj }, { multi: true })
    .exec(function (err, resUpdate) {
      if (resUpdate) {
        response = {
          status: true,
          msg: "Successfully updated",
          token: encodeURIComponent(encuId),
        };
      } else {
        response = { status: false, msg: "Invalid request. Please try again" };
      }
      res.json(response);
    });
});

router.get("/viewusers/:id", helpingLib.tokenMiddleware, (req, res) => {
  var id = req.params.id;
  users.findOne({ _id: id }).exec(function (error, resData) {
    if (resData) {
      resData.email =
        encdec.decryptNew(resData.primary_value) +
        encdec.decryptNew(resData.added_val);
      let obj = {
        _id: resData._id,
        username: resData.username,
        email: resData.email,
        firstname: resData.firstname,
        lastname: resData.lastname,
        dob: resData.dob,
        address: resData.address,
        city: resData.city,
        state: resData.state,
        country: resData.country,
        phone: resData.phone,
        profile_pic: resData.profile_pic,
        id_proof: resData.id_proof,
        id_proof1: resData.id_proof1,
        selfie_proof: resData.selfie_proof,
        id_status: resData.id_status,
        selfie_status: resData.selfie_status,
        kyc_status: resData.kyc_status,
      };
      res.json({ status: true, data: obj });
    } else {
      res.json({ status: false, msg: "Invalid request. Please try again" });
    }
  });
});

var mapReferral = function () {};
let _referMap = new mapReferral();
var respData = [];

router.post("/getUserInfo", helpingLib.tokenMiddleware, (req, res) => {
  var info = req.body;
  let userId = info.userId;
  user
    .findOne(
      { _id: mongoose.mongo.ObjectId(userId) },
      {
        _id: 0,
        username: 1,
        refer_id: 1,
        primary_value: 1,
        added_val: 1,
        phone: 1,
      }
    )
    .exec(function (userErr, userRes) {
      userRes.email =
        encdec.decryptNew(userRes.primary_value) +
        encdec.decryptNew(userRes.added_val);
      let obj = {
        username: userRes.username,
        email: userRes.email,
        phone: userRes.phone,
        refer_id: userRes.refer_id,
      };
      user
        .find(
          { referrer_id: userRes.refer_id },
          {
            username: 1,
            refer_id: 1,
            status: 1,
            primary_value: 1,
            added_val: 1,
          }
        )
        .exec(function (levelErr, levelRes) {
          response.refer_id = userRes.refer_id;
          response.refer_count = 0;
          if (levelRes.length != 0) {
            response.data = [];
            response.levelOne = [];
            response.levelTwo = [];
            var inc = 0;
            _referMap.getReferralLevelTwo(levelRes, inc, (resTwo) => {
              let user_status;
              for (i = 0; i < levelRes.length; i++) {
                let first = levelRes[i].primary_value;
                let second = levelRes[i].added_val;
                if (levelRes[i].status == "1") {
                  user_status = "Active";
                } else {
                  user_status = "Inactive";
                }
                var nn = {
                  sno: i + 1,
                  email: encdec.decryptNew(first) + encdec.decryptNew(second),
                  level: "Level 1",
                  username: levelRes[i].username,
                  status: user_status,
                  refer_id: levelRes[i].refer_id,
                };
                response.levelOne.push(nn);
              }
              for (i = 0; i < resTwo.length; i++) {
                let first = resTwo[i].primary_value;
                let second = resTwo[i].added_val;
                if (resTwo[i].status == "1") {
                  user_status = "Active";
                } else {
                  user_status = "Inactive";
                }
                var nn = {
                  sno: i + 1,
                  email: encdec.decryptNew(first) + encdec.decryptNew(second),
                  level: "Level 2",
                  username: resTwo[i].username,
                  status: user_status,
                  refer_id: resTwo[i].refer_id,
                };
                response.levelTwo.push(nn);
              }
              respData = [];
              response.refer_count =
                response.levelOne.length + response.levelTwo.length;
              res.json({
                status: true,
                referral: response,
                userData: obj,
                success: true,
              });
            });
          } else {
            res.json({
              status: true,
              referral: response,
              userData: obj,
              success: false,
              message: "No Records",
            });
          }
        });
    });
});

mapReferral.prototype.getReferralLevelTwo = function (data, inc, callback) {
  var info = data[inc];
  user
    .find(
      { referrer_id: info.refer_id },
      { username: 1, refer_id: 1, status: 1, primary_value: 1, added_val: 1 }
    )
    .exec(function (levelErr, levelRes) {
      if (levelRes.length != 0) {
        for (var i = 0; i < levelRes.length; i++) {
          respData.push(levelRes[i]);
        }
        if (inc < data.length - 1) {
          inc++;
          _referMap.getReferralLevelTwo(data, inc, callback);
        } else {
          callback(respData);
        }
      } else {
        if (inc < data.length - 1) {
          inc++;
          _referMap.getReferralLevelTwo(data, inc, callback);
        } else {
          callback(respData);
        }
      }
    });
};

router.post("/loghistory", helpingLib.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var ftype = info.ftype || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? -1 : 1;
  var sort = srt;
  var skip = size * pageNo;
  var limit = size;
  // search
  var search = {};
  var regex = new RegExp(filter, "i");
  if (filter != "" && ftype != "") {
    if (ftype == "ip") {
      search = { ip_address: regex };
    } else {
      var fl = filter.toLowerCase();
      let ismail = validator.isEmail(fl);
      if (ismail) {
        var first = encdec.encryptNew(encdec.firstNewMail(fl));
        var second = encdec.encryptNew(encdec.secondNewMail(fl));
        search = { "users.primary_value": first, "users.added_val": second };
      } else {
        search = { "users.username": regex };
      }
    }
    async.parallel(
      {
        logCount: function (cb) {
          userhis
            .aggregate([
              {
                $lookup: {
                  from: "user_info",
                  localField: "user_id",
                  foreignField: "_id",
                  as: "users",
                },
              },
              { $match: search },
              { $group: { _id: null, count: { $sum: 1 } } },
            ])
            .exec(cb);
        },
        logData: function (cb) {
          userhis
            .aggregate([
              {
                $lookup: {
                  from: "user_info",
                  localField: "user_id",
                  foreignField: "_id",
                  as: "users",
                },
              },
              { $match: search },
              {
                $project: {
                  _id: 0,
                  primary_value: { $arrayElemAt: ["$users.primary_value", 0] },
                  added_val: { $arrayElemAt: ["$users.added_val", 0] },
                  ip_address: "$ip_address",
                  browser: "$browser",
                  deviceinfo: "$deviceinfo",
                  created_at: "$created_at",
                },
              },
              { $sort: sort },
              { $skip: skip },
              { $limit: limit },
            ])
            .exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        let resData = results.logData;
        for (i = 0; i < resData.length; i++) {
          let first = resData[i].primary_value;
          let second = resData[i].added_val;
          if (
            first != "" &&
            first != undefined &&
            second != "" &&
            second != undefined
          ) {
            resData[i].email =
              encdec.decryptNew(first) + encdec.decryptNew(second);
          } else {
            resData[i].email = "";
          }
        }
        response.status = true;
        response.data = resData;
        if (results.logCount.length > 0) {
          response.logCount = results.logCount[0].count;
        } else {
          response.logCount = 0;
        }
        res.json(response);
      }
    );
  } else {
    response.status = true;
    response.data = [];
    response.logCount = 0;
    res.json(response);
  }
});

router.post(
  "/login_attempt",
  helpingLib.originMiddle,
  function (req, res, next) {
    var info = req.body;
    var filter = info.filter || "";
    var pageNo = parseInt(info.pageIndex) || 0;
    var sortOrder = info.sortOrder;
    var size = parseInt(info.pageSize);
    var sortName = info.sortActive;
    var srt = {};
    srt[sortName] = sortOrder == "desc" ? -1 : 1;
    var query = {};
    var sort = srt;
    var skip = size * pageNo;
    var limit = size;
    // search
    var search = {};
    var regex = new RegExp(filter, "i");
    let one = encdec.encryptNewEmail(filter);
    if (filter != "") {
      if (moment(new Date(filter), "YYYY-MM-DD h:mm:ss").isValid()) {
        var newDate = "";
        var newDate1 = "";
        var searchDate = new Date(filter);
        var srdate = new Date(filter);
        searchDate.setDate(searchDate.getDate());
        srdate.setDate(srdate.getDate() + 1);
        newDate = searchDate.toISOString();
        newDate1 = srdate.toISOString();
        search = {
          $or: [
            { ip_address: regex },
            { emailid: regex },
            { browser: regex },
            { deviceinfo: regex },
            {
              created_at: { $gte: new Date(newDate), $lt: new Date(newDate1) },
            },
          ],
        };
      } else {
        search = {
          $or: [
            { ip_address: regex },
            { browser: regex },
            { deviceinfo: regex },
            { emailid: regex },
          ],
        };
      }
    } else {
      search = {
        $or: [
          { ip_address: regex },
          { browser: regex },
          { deviceinfo: regex },
          { emailid: regex },
        ],
      };
    }
    async.parallel(
      {
        logCount: function (cb) {
          Attempts.find(search).countDocuments().exec(cb);
        },
        logData: function (cb) {
          Attempts.find(
            search,
            {
              ip_address: 1,
              emailid: 1,
              browser: 1,
              attemptCount: 1,
              deviceinfo: 1,
              created_at: 1,
              status: 1,
            },
            query
          ).exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        let resData = results.logData;
        response.status = true;
        response.data = resData;
        response.logCount = results.logCount;
        res.json(response);
      }
    );
  }
);

router.post(
  "/userGamehistory",
  helpingLib.originMiddle,
  function (req, res, next) {
    var userid = "643feb97784aff5341161b62";
    async.parallel(
      {
        limboCount: function (cb) {
          betHistory
            .find({ user_id: userid, game: "limbo" })
            .limit(25)
            .exec(cb);
        },
        diceCount: function (cb) {
          betHistory.find({ user_id: userid, game: "dice" }).limit(25).exec(cb);
        },
        coinflipCount: function (cb) {
          coinhistory
            .find({ user_id: userid, game: "coinflip" })
            .limit(25)
            .exec(cb);
        },
        wheelCount: function (cb) {
          wheelhistory
            .find({ user_id: userid, game: "wheel" })
            .limit(25)
            .exec(cb);
        },
        fortuneCount: function (cb) {
          fortune.find({ user_id: userid, game: "fortune" }).limit(25).exec(cb);
        },
        plunderCount: function (cb) {
          cave
            .find({ user_id: userid, game: "caveofplunder" })
            .limit(25)
            .exec(cb);
        },
        kenoCount: function (cb) {
          keno.find({ user_id: userid, game: "keno" }).limit(25).exec(cb);
        },
        rouletteCount: function (cb) {
          roulette
            .find({ user_id: userid, game: "roulette" })
            .limit(25)
            .exec(cb);
        },
        minesCount: function (cb) {
          mines.find({ user_id: userid, game: "mines" }).limit(25).exec(cb);
        },
      },
      function (err, results) {
        if (err) {
          return res.status(500);
        }
        let data = {};
        data.status = true;
        data.limbo = results.limboCount;
        data.dice = results.diceCount;
        data.flip = results.coinflipCount;
        data.wheel = results.wheelCount;
        data.fortune = results.fortuneCount;
        data.plunder = results.plunderCount;
        data.keno = results.kenoCount;
        data.roulette = results.rouletteCount;
        data.mine = results.minesCount;

        res.json(data);
      }
    );
  }
);

router.post("/pendingKyc", helpingLib.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? -1 : 1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");
  // search
  var search = {};

  var start = "";
  if (info.startDate != "") {
    if (moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var startDate = new Date(info.startDate);
      startDate.setDate(startDate.getDate() + 1);
      start = startDate.toISOString();
    }
  }
  var end = "";
  if (info.endDate != "") {
    if (moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
      var endDate = new Date(info.endDate);
      endDate.setDate(endDate.getDate() + 1);
      end = endDate.toISOString();
    }
  }

  if (start != "" && end != "") {
    search["$or"] = [
      { created_at: { $gte: new Date(start), $lt: new Date(end) } },
    ];
  }
  search = {};
  async.parallel(
    {
      usersCount: function (cb) {
        users.find(search).countDocuments().exec(cb);
      },
      usersData: function (cb) {
        users
          .find(
            { kyc_status: 1 },
            {
              _id: 1,
              username: 1,
              luck_value: 1,
              added_value: 1,
              status: 1,
              created_at: 1,
              kyc_status: 1,
              tfa_status: 1,
            },
            query
          )
          .sort({ date: -1 })
          .exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      emailConcat(results.usersData, function (resData) {
        response.status = true;
        response.data = resData;
        response.userCount = results.usersCount - 1;
        res.json(response);
      });
    }
  );
});

router.post(
  "/getUser_game",
  helpingLib.tokenMiddleware,
  function (req, res, next) {
    var info = req.body;
    var encuId = encdec.decryptNew(info.userId);
    users
      .findOne(
        { _id: mongoose.mongo.ObjectId(encuId) },
        { gamecount: 1, _id: 0 }
      )
      .exec(function (error, resData) {
        const game = resData.gamecount;
        const Game = game.find((game) => game.name === info.gamename);
        if (Game) {
          if (Game.name == "limbo" || Game.name == "dice") {
            limboDice(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "coinflip") {
            coinflip(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "wheel") {
            wheel(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "fortune") {
            fortunes(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "caveofplunder") {
            caves(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "keno") {
            kenos(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "roulette") {
            roulettes(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "mines") {
            mine(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "plinko") {
            plinkos(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }

          if (Game.name == "crash" || Game.name == "bustabet") {
            crashed(Game.name, encuId, function (response) {
              return res.json({ status: 1, data: Game, profit: response });
            });
          }
        } else {
          res.json({ status: 0, data: "No  game found" });
        }
      });
  }
);

function limboDice(gameName, userId, cb) {
  betHistory
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId), game: gameName } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "winner"],
                },
                "$bet_amount",
                0,
              ],
            },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function coinflip(gameName, userId, cb) {
  coinhistory
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function wheel(gameName, userId, cb) {
  wheelhistory
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function fortunes(gameName, userId, cb) {
  fortune
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function caves(gameName, userId, cb) {
  cave
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function kenos(gameName, userId, cb) {
  keno
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function roulettes(gameName, userId, cb) {
  roulette
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function mine(gameName, userId, cb) {
  mines
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function plinkos(gameName, userId, cb) {
  plinko
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

function crashed(gameName, userId, cb) {
  crash
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(userId) } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$bet_amount" },
          totalProfit: {
            $sum: { $cond: [{ $eq: ["$status", "winner"] }, "$bet_amount", 0] },
          },
        },
      },
    ])
    .exec(function (err, data) {
      if (data.length > 0) {
        cb(data);
      } else {
        cb(0);
      }

      if (err) {
        cb(0);
      }
    });
}

module.exports = router;
