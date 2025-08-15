const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const async = require("async");

const moment = require("moment");
const validator = require("validator");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const useragent = require("useragent");
const multer = require("multer");

//helpers
const encrypt = require("../helpers/encrypt");
const common = require("../helpers/common");
const mail = require("../helpers/mail");
const cloudinary = require("../helpers/cloudinary");
const game = require("../helpers/game");

//schemas
const users = require("../model/users");
const logs = require("../model/user_history");
const currency = require("../model/currency");
const wallet = require("../model/userWallet");
const referrals = require("../model/referral");
const gamelist = require("../model/gamelist");
const siteSettings = require("../model/siteSettings");
const deposit = require("../model/deposit");
const withdraw = require("../model/withdraw");
const vipLvl = require("../model/vip_level");
const notify = require("../model/notify");
const blog = require("../model/blog");
const spinBonus = require("../model/spin_bonus");

const betHis = require("../model/bet_history");
const coinflipBetHis = require("../model/coinflip_bethis");
const kenoBetHis = require("../model/keno_bet_history");
const minesBetHis = require("../model/mines_bethistory");
const wheelBetHis = require("../model/wheel_result");
const fortuneBetHis = require("../model/wheeloffortune");
const rouletteBetHis = require("../model/roulette_bethistory");
const swordBetHis = require("../model/sword_bethistory");
const caveBetHis = require("../model/cave_bethistory");
const plinkoBetHis = require("../model/plinko_bethistory");

var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, common.randomString(4) + new Date().getTime() + file.originalname);
  },
});
var upload = multer({ storage: storage });

// const Binance = require('binance-api-node').default
// const client = Binance();
// const client2 = Binance({
//   apiKey: 'N5IK3wHDnzYFqx0LdTUMHSiEPwY1ilehE18Elhd35fzqJeuvmLXhaVgPvM0W7AqO',
//   apiSecret: '7heODUi1h6rhTOUZsnU8sIGiomOytnpTAVRlXHyrwfXDDwz5o0DOIistaHgTKemF',
//   getTime: Date.now,
// });
// client.time().then(time => console.log(time));

const axios = require("axios");

const API_KEY =
  "N5IK3wHDnzYFqx0LdTUMHSiEPwY1ilehE18Elhd35fzqJeuvmLXhaVgPvM0W7AqO";
const API_SECRET =
  "7heODUi1h6rhTOUZsnU8sIGiomOytnpTAVRlXHyrwfXDDwz5o0DOIistaHgTKemF";
const API_ENDPOINT = "https://api.binance.com/wapi/v3/createWithdraw.html";

const params = {
  apiKey: API_KEY,
  asset: "BTC", // The asset for which you want to create a new address
  recvWindow: 60000, // Optional
};

/*const ethers = require('ethers');
const bip39 = require('bip39');
const crypto = require('crypto');
//const mnemonic = bip39.entropyToMnemonic(crypto.randomBytes(32));*/

router.get("/sampleBin", async function (req, res) {
  /*axios.post(API_ENDPOINT, null, { params })
	  .then(response => {
	    if (response.data && response.data.success) {
	      const newAddress = response.data.address;
	      console.log('New Address:', newAddress);
	    } else {
	      console.error('Failed to create a new address:', response.data);
	    }
	  })
	  .catch(error => {
	    console.error('Error:', error);
	  });*/

  var add = await client2.depositAddress({ coin: "BTC" });
  return res.json({ add: add });
  //https://www.npmjs.com/package/binance-api-node#deposithistory
});

router.get("/testFunction", function (req, res) {
  res.json({ success: "true", msg: "success" });
});

router.get("/logs", (req, res) => {
  var path = require("path");
  var file = path.join(__dirname, ".././logs/combined.outerr-0.log");
  res.download(file);
});

router.post("/getCurrencyInfo", function (req, res) {
  var curr = req.body.currency;
  currency
    .findOne(
      { currency: curr },
      {
        min_bet: 1,
        max_bet: 1,
        network: 1,
        type: 1,
        max_withdraw: 1,
        min_withdraw: 1,
        withdraw_fee: 1,
        max_deposit: 1,
        min_deposit: 1,
      }
    )
    .exec(function (err1, res1) {
      if (res1) {
        res.json({
          success: 1,
          min_bet: res1.min_bet,
          max_bet: res1.max_bet,
          currData: res1,
        });
      } else {
        res.json({ success: 0, min_bet: 100, max_bet: 10000000 });
      }
    });
});

router.post("/getBalance", common.userVerify, function (req, res) {
  var userCurr = req.body.currency;
  var userId = mongoose.mongo.ObjectId(req.userId);
  wallet.findOne({ user_id: userId }).exec(function (err1, res1) {
    if (res1) {
      var valueOfcurrency = res1.wallet.find(
        (curr) => curr.currency === userCurr
      );
      res.json({ success: 1, balance: valueOfcurrency.amount });
    } else {
      res.json({ success: 0, balance: 0 });
    }
  });
});

router.post("/getminbetamount", common.userVerify, function (req, res) {
  var userCurr = req.body.currency;
  currency.findOne({ currency: userCurr }).exec(function (err1, res1) {
    if (res1) {
      res.json({ success: 1, min_bet: res1.min_bet, max_bet: res1.max_bet });
    } else {
      res.json({ success: 0 });
    }
  });
});

router.get("/generateAddress", function (req, res) {
  var userCurr = "BNB";
  var userid = "643e3f08b0294a5484a68890";
  game.generateAddress("BNB", userid);
});

router.post("/findUsername", function (req, res) {
  // req.body.username = req.body.username.toUpperCase();
  users.findOne({ username: req.body.username }).exec(function (err, data) {
    if (data) {
      return res.json({ success: 0, msg: "username already exists" });
    } else {
      return res.json({ success: 1, msg: "username not defined!" });
    }
  });
});

router.post("/findEmail", function (req, res) {
  var email = req.body.email;
  let e = validator.isEmail(email);
  let usrmail = email.toLowerCase();
  var firstEmail = encrypt.encryptNew(common.firstNewMail(usrmail));
  var secondEmail = encrypt.encryptNew(common.secondNewMail(usrmail));
  users
    .find({ $and: [{ luck_value: firstEmail, added_value: secondEmail }] })
    .countDocuments()
    .exec(function (userErr, userRes) {
      if (userRes && e) {
        return res.json({ success: 0, msg: "Email already exists" });
      } else {
        return res.json({ success: 1 });
      }
    });
});

router.post("/signup", (req, res) => {
  try {
    let info = req.body;
    console.log(info);
    let email = validator.isEmail(info.email);
    // let cunty = validator.isEmpty(info.country);
    let nam = validator.isEmpty(info.username);

    if (email && !nam) {
      let usermail = info.email.toLowerCase();
      var firstEmail = encrypt.encryptNew(common.firstNewMail(usermail));
      var secondEmail = encrypt.encryptNew(common.secondNewMail(usermail));
      users
        .findOne({
          $or: [{ luck_value: firstEmail, added_value: secondEmail }],
          username: info.username,
        })
        .countDocuments()
        .exec(function (userErr, userRes) {
          if (userRes) {
            res.json({ success: 0, msg: "Username/Email already exists" });
          } else {
            var pwds = [];
            var ip =
              req.header("x-forwarded-for") || req.connection.remoteAddress;
            ip = ip.replace("::ffff:", "");
            var qrName = `ROLLGAME (${usermail})`;
            var secret = speakeasy.generateSecret({ length: 10, name: qrName });
            var tfaCode = secret.base32;
            var tfaUrl = secret.otpauth_url;
            var url = tfaUrl.replace(tfaCode, "");
            common.checkRefer(info.refer, (refRes) => {
              if (refRes) {
                common.referId((refId) => {
                  /*common.uniqueName((useName) => {*/
                  encrypt.hashPswd(info.password, function (pass) {
                    pwds.push(pass);
                    if (info.refer != "") {
                      var ref_status = 1;
                    }
                    let obj = {
                      username: info.username,
                      luck_value: firstEmail,
                      added_value: secondEmail,
                      protect_key: pass,
                      tfa_code: encrypt.withEncrypt(tfaCode),
                      tfa_url: url,
                      status: 0,
                      referr_id: refId,
                      referrer_id: info.refer,
                      // country 		: info.country,
                      ip_address: ip,
                      ref_status: ref_status,
                      secretkey: pwds,
                    };
                    users.create(obj, function (err, resData) {
                      if (resData) {
                        var userId = resData._id;
                        var encuId = encrypt.encryptNew(userId.toString());
                        var uri =
                          common.getUrl() +
                          "activate_account?token=" +
                          encodeURIComponent(encuId);
                        // console.log(uri);
                        var specialVars = {
                          "###LINK###": uri,
                          "###USER###": info.username,
                          "###LINK1###": uri,
                        };
                        mail.sendMail(
                          usermail,
                          "activate_mail",
                          specialVars,
                          function (mailRes) {}
                        );

                        gamelist
                          .find({}, { _id: 0, game_name: 1 })
                          .exec(function (Err, Res) {
                            let Data = { gamecount: [] };
                            common.gamecount(
                              Res,
                              resData._id,
                              function (data) {}
                            );
                          });
                        currency
                          .find({}, { _id: 0, currency: 1 })
                          .exec(function (curErr, curRes) {
                            let walData = { wallet: [], user_id: resData._id };
                            common.wagecount(
                              curRes,
                              resData._id,
                              function (data) {}
                            );
                            common.activateWallet(
                              curRes,
                              walData,
                              function (data) {
                                game.generateAddress("BNB", userId);
                                wallet.create(data, function (walErr, walRes) {
                                  if (walRes) {
                                    res.json({
                                      success: 1,
                                      msg: "Account activation link sent to your email",
                                    });
                                  } else {
                                    res.json({
                                      success: 0,
                                      msg: "Failed to create wallet",
                                    });
                                  }
                                });
                              }
                            );
                          });
                      } else {
                        res.json({
                          success: 0,
                          msg: "Failed to create an user.",
                        });
                      }
                    });
                  });
                  /*})*/
                });
              } else {
                return res.json({ success: 0, msg: "Invalid Refer ID" });
              }
            });
          }
        });
    } else {
      res.json({ success: 0, msg: "Please enter all details" });
    }
  } catch (e) {
    console.log(e);
    res.json({ success: 0, msg: "Something went wrong" });
  }
});

router.post("/login", function (req, res) {
  var info = req.body;
  let email = validator.isEmail(info.email);
  let password = validator.isEmpty(info.password);
  if (email && !password) {
    var firstEmail = encrypt.encryptNew(common.firstNewMail(info.email));
    var secondEmail = encrypt.encryptNew(common.secondNewMail(info.email));

    users
      .findOne(
        { luck_value: firstEmail, added_value: secondEmail },
        {
          _id: 1,
          status: 1,
          protect_key: 1,
          tfa_status: 1,
          user_favourites: 1,
          liked_game: 1,
        }
      )
      .exec(function (userErr, userData) {
        console.log(userData);
        if (userData) {
          var encUserId = encrypt.encryptNew(userData._id.toString());
          encrypt.comparePswd(
            info.password,
            userData.protect_key,
            function (passData) {
              if (passData) {
                if (userData.status == 0) {
                  return res.json({
                    success: 0,
                    msg: "Activate your account !",
                  });
                } else if (userData.status == 2) {
                  return res.json({
                    success: 0,
                    msg: "you'r account has been blocked !",
                  });
                } else {
                  if (userData.tfa_status == 1) {
                    return res.json({
                      success: 2,
                      ttoken: encodeURIComponent(encUserId),
                    });
                  } else {
                    let ip =
                      req.header("x-forwarded-for") ||
                      req.connection.remoteAddress;
                    ip = ip.replace("::ffff:", "");
                    var agent = useragent.parse(req.headers["user-agent"]);
                    var os = agent.os.toString().split(" ")[0];
                    var browser = agent.toAgent().split(" ")[0];
                    let obj = {
                      user_id: userData._id,
                      ip_address: ip,
                      browser: browser,
                      image: "",
                      deviceinfo: os,
                      types: "Account Login",
                    };
                    logs.create(obj, function (err, result) {
                      if (result) {
                        let authKey = common.createPayload(
                          userData._id.toString()
                        );
                        var fav = userData.user_favourites;
                        var like = userData.liked_game;
                        return res.json({
                          success: 1,
                          token: authKey,
                          ttoken: encUserId,
                          favourite: fav,
                          liked: like,
                        });
                      } else {
                        return res.json({ success: 0, msg: "Failed to login" });
                      }
                    });
                  }
                }
              } else {
                return res.json({ success: 0, msg: "Wrong Password !" });
              }
            }
          );
        } else {
          return res.json({ success: 0, msg: "Wrong Email address !" });
        }
      });
  } else {
    return res.json({ success: 0, msg: "Invalid login credential !" });
  }
});

router.post("/forgotPassword", (req, res) => {
  try {
    let info = req.body;
    let email = validator.isEmail(info.resetemail);
    if (email) {
      let usermail = info.resetemail.toLowerCase();
      var firstEmail = encrypt.encryptNew(common.firstNewMail(info.resetemail));
      var secondEmail = encrypt.encryptNew(
        common.secondNewMail(info.resetemail)
      );
      users
        .findOne(
          { luck_value: firstEmail, added_value: secondEmail, status: 1 },
          { username: 1 }
        )
        .exec(function (userErr, userRes) {
          if (userRes) {
            var encUserId = encrypt.encryptNew(userRes.username);
            var encRandId = encrypt.encryptNew(common.generateRandomNumber());
            users
              .updateOne(
                { _id: userRes._id },
                { $set: { forgot_code: encRandId } }
              )
              .exec(function (upErr, upRes) {
                if (upRes) {
                  var link =
                    common.getUrl() +
                    "reset_password?token=" +
                    encodeURIComponent(encUserId) +
                    "&verify=" +
                    encodeURIComponent(encRandId);
                  var specialVars = {
                    "###LINK###": link,
                    "###URL###": link,
                    "###USER###": userRes.username,
                  };
                  console.log(link);
                  mail.sendMail(
                    usermail,
                    "forgot_password",
                    specialVars,
                    function (mailRes) {
                      res.json({ success: 1 });
                    }
                  );
                } else {
                  res.json({ success: 0, msg: "Please try again later" });
                }
              });
          } else {
            res.json({ success: 0, msg: "Email not exists" });
          }
        });
    } else {
      res.json({ success: 0, msg: "Enter valid email" });
    }
  } catch (e) {
    console.log(e);
    res.json({ success: 0, msg: "Something went wrong" });
  }
});

router.post("/reset_password", function (req, res) {
  try {
    let info = req.body;
    let comparePwd = validator.equals(info.pwd, info.conpwd);
    let tokenVal = validator.isEmpty(info.token);
    let verifyVal = validator.isEmpty(info.verify);
    let passArr = [];
    if (comparePwd && !tokenVal && !verifyVal) {
      var username = encrypt.decryptNew(decodeURIComponent(info.token));
      users
        .findOne(
          { username: username, forgot_code: decodeURIComponent(info.verify) },
          { _id: 1, secretkey: 1 }
        )
        .exec(function (userErr, userRes) {
          if (userRes) {
            passArr = userRes.secretkey;
            encrypt.hashPswd(info.pwd, function (encPwd) {
              encrypt.cmpreMultiPwd(info.pwd, passArr, function (cmpVal) {
                if (cmpVal == 1) {
                  return res.json({
                    success: 0,
                    msg: "Password should not match with last five passwords",
                  });
                } else {
                  if (userRes.secretkey.length < 5) {
                    passArr.push(encPwd);
                  } else {
                    passArr.shift();
                    passArr.push(encPwd);
                  }
                  users
                    .updateOne(
                      { _id: userRes._id },
                      {
                        $set: {
                          forgot_code: "",
                          protect_key: encPwd,
                          secretkey: passArr,
                        },
                      }
                    )
                    .exec(function (upErr, upRes) {
                      if (upRes) {
                        return res.json({
                          success: 1,
                          msg: "Password updated successfully",
                        });
                      } else {
                        return res.json({
                          success: 0,
                          msg: "Failed to update password",
                        });
                      }
                    });
                }
              });
            });
          } else {
            res.json({ success: 0, msg: "Reset password link expired" });
          }
        });
    } else if (!comparePwd) {
      res.json({ success: 0, msg: "Password does not match" });
    } else {
      res.json({ success: 0, msg: "Please enter all details" });
    }
  } catch (e) {
    res.json({ success: 0, msg: "Something went wrong" });
  }
});

router.post("/activateEmail", (req, res) => {
  try {
    let info = req.body;
    let tokenVal = validator.isEmpty(info.token);
    if (!tokenVal) {
      var userId = encrypt.decryptNew(decodeURIComponent(info.token));
      if (userId != "") {
        users
          .findOne({ _id: userId }, { status: 1 })
          .exec(function (userErr, userRes) {
            if (userRes) {
              if (userRes.status == 0) {
                var userObj = mongoose.Types.ObjectId(userId);
                users
                  .updateOne({ _id: userObj }, { $set: { status: 1 } })
                  .exec(function (upErr, upRes) {
                    if (upRes) {
                      res.json({
                        success: 1,
                        msg: "Account activated successfully",
                      });
                    } else {
                      res.json({
                        success: 0,
                        msg: "Failed to activate account",
                      });
                    }
                  });
              } else {
                res.json({ success: 0, msg: "Account already activated" });
              }
            } else {
              res.json({ success: 0, msg: "Something wents wrong !" });
            }
          });
      }
    } else {
      res.json({ success: 0, msg: "Invalid Request" });
    }
  } catch (e) {
    res.json({ success: 0, msg: "Something went wrong" });
  }
});

router.post("/tfaLogin", (req, res) => {
  try {
    var info = req.body;
    var userId = encrypt.decryptNew(decodeURIComponent(info.ttoken));
    users.findOne({ _id: userId }).exec(function (err, resData) {
      if (resData) {
        var verified = speakeasy.totp.verify({
          secret: encrypt.withDecrypt(resData.tfa_code),
          encoding: "base32",
          token: info.auth_key,
          window: 1,
        });
        if (verified) {
          let ip =
            req.header("x-forwarded-for") || req.connection.remoteAddress;
          ip = ip.replace("::ffff:", "");
          var agent = useragent.parse(req.headers["user-agent"]);
          var os = agent.os.toString().split(" ")[0];
          var browser = agent.toAgent().split(" ")[0];
          let obj = {
            user_id: userId,
            ip_address: ip,
            browser: browser,
            image: "",
            deviceinfo: os,
            types: "Account Login with TFA",
          };
          logs.create(obj, function (err, result) {
            if (result) {
              let authKey = common.createPayload(userId.toString());
              var usertoken = encrypt.encryptNew(userId.toString());
              return res.json({
                success: 1,
                token: authKey,
                ttoken: usertoken,
              });
            } else {
              res.json({ success: 0, msg: "Failed to login" });
            }
          });
        } else {
          res.json({ success: 2, msg: "Invalid 2FA Code" });
        }
      } else {
        res.json({ success: 2, msg: "Invalid 2FA Code" });
      }
    });
  } catch (e) {
    console.log("loginverifytfq", e);
  }
});

router.post("/withpass", common.tokenMiddleware, function (req, res) {
  var withpass = req.body.with_pass;
  users
    .findOne(
      { _id: mongoose.mongo.ObjectId(req.userId) },
      { _id: 0, with_status: 1, with_pass: 1 }
    )
    .exec(function (err, userData) {
      if (userData) {
        if (userData.with_status == 0) {
          if (withpass !== undefined && withpass !== null && withpass !== "") {
            encrypt.Password(withpass, function (pass) {
              users
                .updateOne(
                  { _id: req.userId },
                  { $set: { with_status: 1, with_pass: pass } }
                )
                .exec(function (upErr, upRes) {
                  if (upRes) {
                    return res.json({
                      success: 1,
                      msg: "Withdarw Password updated successfully",
                    });
                  } else {
                    return res.json({
                      success: 0,
                      msg: "Failed to update Withdarw password",
                    });
                  }
                });
            });
          } else {
            res.json({ success: 0, msg: "Enter Valid withdraw password!" });
          }
        } else {
          res.json({ success: 0, msg: "Already withdraw password updated !" });
        }
      } else {
        res.json({ success: 0, msg: "User is undefind !" });
      }
    });
});

router.get("/getUserdetals", common.tokenMiddleware, (req, res) => {
  var Id = req.userId;
  users
    .findOne(
      { _id: mongoose.mongo.ObjectId(Id) },
      { username: 1, _id: 0, referr_id: 1, profileImg: 1, vip: 1 }
    )
    .exec(function (refRrr, refData) {
      if (refData) {
        return res.json({ success: 1, user: refData });
      } else {
        return res.json({ success: 0, msg: "User not defined!" });
      }
    });
});

router.get("/referralData", common.tokenMiddleware, (req, res) => {
  var Id = req.userId;
  users
    .findOne({ _id: mongoose.mongo.ObjectId(Id) }, { referr_id: 1, _id: 0 })
    .exec(function (refRrr, refData) {
      if (refData) {
        users
          .find(
            { referrer_id: refData.referr_id },
            { _id: 0, username: 1, luck_value: 1, added_value: 1 }
          )
          .sort({ created_at: -1 })
          .exec(function (refListRrr, refList) {
            if (refList.length !== 0) {
              referralUserData(refList, function (returnData) {
                if (returnData) {
                  return res.json({
                    success: 1,
                    referr_id: refData.referr_id,
                    referralData: returnData,
                  });
                } else {
                  return res.json({
                    success: 0,
                    msg: "Something wents wrong !",
                  });
                }
              });
            } else {
              return res.json({
                success: 1,
                referr_id: refData.referr_id,
                referralData: [],
              });
            }
          });
      } else {
        return res.json({ success: 0, msg: "User not defined!" });
      }
    });
});

function referralUserData(ref, callback) {
  var length = ref.length;
  var referralList = [];
  if (length > 0) {
    var i = 1;
    ref.forEach(async (val) => {
      var usermail =
        encrypt.decryptNew(val.luck_value) +
        encrypt.decryptNew(val.added_value);
      const refLis = {
        username: val.username,
        email: usermail,
      };
      referralList.push(refLis);
      if (i == length) {
        callback(referralList);
      }
      i = i + 1;
    });
  } else {
    callback([]);
  }
}

router.post("/getFavCount", function (req, res) {
  var game = req.body.name;
  gamelist
    .findOne({ game_name: game }, { fav_count: 1, _id: 0 })
    .exec(function (Err, Res) {
      if (Err) {
        return res.json({ success: 0, msg: "somthing wents wrong !" });
      }
      if (Res) {
        return res.json({ success: 1, msg: Res.fav_count });
      } else {
        return res.json({ success: 0, msg: "data not found" });
      }
    });
});

router.post("/check_oldPass", common.tokenMiddleware, function (req, res) {
  var info = req.body;
  var passArr = [];
  users
    .findOne({ _id: req.userId }, { _id: 0, protect_key: 1 })
    .exec(function (passerr, passData) {
      if (passData) {
        passArr = passData.protect_key;
        encrypt.comparePswd(info.pass, passArr, function (cmpVal) {
          if (cmpVal == 1) {
            return res.json({ success: 1 });
          } else {
            return res.json({ success: 0 });
          }
        });
      } else {
        return res.json({ success: 0, msg: "user undefined !" });
      }
    });
});

router.post("/check_newPass", common.tokenMiddleware, function (req, res) {
  var info = req.body;
  var passArr = [];
  users
    .findOne({ _id: req.userId }, { _id: 0, secretkey: 1 })
    .exec(function (passerr, passData) {
      if (passData) {
        passArr = passData.secretkey;
        encrypt.cmpreMultiPwd(info.pass, passArr, function (cmpVal) {
          if (cmpVal == 1) {
            return res.json({
              success: 0,
              msg: "Password should not match with last five passwords !",
            });
          } else {
            return res.json({ success: 1 });
          }
        });
      } else {
        return res.json({ success: 0, msg: "user undefined !" });
      }
    });
});

router.post("/getLikeCount", function (req, res) {
  var game = req.body.name;
  gamelist
    .findOne({ game_name: game }, { like_count: 1, _id: 0 })
    .exec(function (Err, Res) {
      if (Err) {
        return res.json({ success: 0, msg: "somthing wents wrong !" });
      }
      if (Res) {
        return res.json({ success: 1, msg: Res.like_count });
      } else {
        return res.json({ success: 0, msg: "data not found" });
      }
    });
});

router.post("/updatepwd", common.tokenMiddleware, function (req, res) {
  try {
    let info = req.body;
    let comparePwd = validator.equals(info.password, info.confirm_password);
    let oldPass = validator.isEmpty(info.oldPassword);
    if (comparePwd && !oldPass) {
      var passArr = [];
      users
        .findOne({ _id: req.userId }, { _id: 0, protect_key: 1, secretkey: 1 })
        .exec(function (passerr, passData) {
          if (passData) {
            passArr = passData.secretkey;
            encrypt.comparePswd(
              info.oldPassword,
              passData.protect_key,
              function (cmpVal) {
                if (cmpVal == 1) {
                  encrypt.hashPswd(info.password, function (encPwd) {
                    encrypt.cmpreMultiPwd(
                      info.password,
                      passArr,
                      function (multCmpVal) {
                        if (multCmpVal == 1) {
                          return res.json({
                            success: 0,
                            msg: "Password should not match with last five passwords",
                          });
                        } else {
                          if (passData.secretkey.length < 5) {
                            passArr.push(encPwd);
                          } else {
                            passArr.shift();
                            passArr.push(encPwd);
                          }
                          users
                            .updateOne(
                              { _id: req.userId },
                              {
                                $set: {
                                  protect_key: encPwd,
                                  secretkey: passArr,
                                },
                              }
                            )
                            .exec(function (upErr, upRes) {
                              if (upRes) {
                                return res.json({
                                  success: 1,
                                  msg: "Password updated successfully",
                                });
                              } else {
                                return res.json({
                                  success: 0,
                                  msg: "Failed to update password",
                                });
                              }
                            });
                        }
                      }
                    );
                  });
                } else {
                  return res.json({
                    success: 0,
                    msg: "Old password not matched !",
                  });
                }
              }
            );
          } else {
            return res.json({ success: 0, msg: "user undefined !" });
          }
        });
    } else if (!comparePwd) {
      res.json({ success: 0, msg: "Password does not match" });
    } else {
      res.json({ success: 0, msg: "Please enter all details" });
    }
  } catch (e) {
    res.json({ success: 0, msg: "Something went wrong" });
  }
});

router.get("/TFAData", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  users
    .findOne(
      { _id: id },
      {
        _id: 0,
        luck_value: 1,
        added_value: 1,
        tfa_code: 1,
        tfa_url: 1,
        tfa_status: 1,
      }
    )
    .exec(function (error, resData) {
      if (resData) {
        var usermail =
          encrypt.decryptNew(resData.luck_value) +
          encrypt.decryptNew(resData.added_value);
        const passData = {
          tfa_code: resData.tfa_code,
          tfa_url: resData.tfa_url,
          tfa_status: resData.tfa_status,
        };
        if (passData.tfa_code == "" && passData.tfa_url == "") {
          var qrName = `ROLLGAME (${usermail})`;
          var secret = speakeasy.generateSecret({ length: 10, name: qrName });
          var tfaCode = secret.base32;
          var tfaUrl = secret.otpauth_url;
          var url = tfaUrl.replace(tfaCode, "");
          var updateVal = {
            tfa_code: encrypt.withEncrypt(tfaCode),
            tfa_url: url,
          };
          users
            .updateOne({ _id: userId }, { $set: updateVal })
            .exec(function (err, resUpdate) {
              if (resUpdate) {
                passData.tfa_code = tfaCode;
                passData.tfa_url = common.getQrUrl + tfaUrl;
                return res.json({ success: 1, tfaData: passData });
              } else {
                return res.json({ success: 0, msg: "somthing wents wrong !" });
              }
            });
        } else {
          var tfaCode = encrypt.withDecrypt(passData.tfa_code);
          var tfaUrl = passData.tfa_url + tfaCode;
          passData.tfa_code = tfaCode;
          passData.tfa_url = common.getQrUrl + tfaUrl;
          return res.json({ success: 1, tfaData: passData });
        }
      }
    });
});

router.post("/updateTfa", common.tokenMiddleware, (req, res) => {
  try {
    var info = req.body;
    users
      .findOne(
        { _id: req.userId },
        {
          _id: 0,
          luck_value: 1,
          added_value: 1,
          tfa_code: 1,
          tfa_url: 1,
          tfa_status: 1,
          protect_key: 1,
        }
      )
      .exec(function (err, userRes) {
        if (userRes) {
          encrypt.comparePswd(
            info.pwd,
            userRes.protect_key,
            function (passData) {
              if (passData) {
                var verified = speakeasy.totp.verify({
                  secret: encrypt.withDecrypt(userRes.tfa_code),
                  encoding: "base32",
                  token: info.tfa_code,
                });
                var usermail =
                  encrypt.decryptNew(userRes.luck_value) +
                  encrypt.decryptNew(userRes.added_value);
                if (verified) {
                  if (userRes.tfa_status == 0 || userRes.tfa_status == 2) {
                    var updateVal = { tfa_status: 1, tfa_update: Date.now() };
                    var updatedRule = { tfa_status: 1 };
                    var status = "enabled";
                  } else if (userRes.tfa_status == 1) {
                    var qrName = `ROLLGAME (${usermail})`;
                    var secret = speakeasy.generateSecret({
                      length: 10,
                      name: qrName,
                    });
                    var tfaCode = secret.base32;
                    var tfaUrl = secret.otpauth_url;
                    var url = tfaUrl.replace(tfaCode, "");
                    var updateVal = {
                      tfa_status: 0,
                      tfa_code: encrypt.withEncrypt(tfaCode),
                      tfa_url: url,
                      tfa_update: Date.now(),
                    };
                    var updatedRule = {
                      tfa_status: 0,
                      tfa_code: tfaCode,
                      tfa_url: common.getQrUrl + tfaUrl,
                    };
                    var status = "disabled";
                  }
                  users
                    .updateOne({ _id: req.userId }, { $set: updateVal })
                    .exec(function (err, upRes) {
                      if (err) {
                        return res.json({
                          success: 0,
                          msg: "Please try again",
                        });
                      }
                      if (upRes) {
                        return res.json({ success: 1, result: updatedRule });
                      }
                    });
                } else {
                  return res.json({ success: 0, msg: "Invalid 2FA Code" });
                }
              } else {
                return res.json({ success: 0, msg: "Wrong Password !" });
              }
            }
          );
        } else {
          return res.json({ success: 0, msg: "Something wents wrong !" });
        }
      });
  } catch (e) {
    return res.status(401).send("Something wents wrong ! ");
  }
});

router.get("/GetProfile", common.tokenMiddleware, (req, res) => {
  users
    .findOne(
      { _id: mongoose.mongo.ObjectId(req.userId) },
      {
        firstname: 1,
        lastname: 1,
        country: 1,
        gender: 1,
        DOB: 1,
        address: 1,
        zip_code: 1,
        city: 1,
        _id: 0,
        id_status: 1,
        kyc_status: 1,
        passport_status: 1,
        selfie_status: 1,
        residence_status: 1,
        id_proof: 1,
        id_proof1: 1,
        passport_proof: 1,
        residence_proof: 1,
        selfie_proof: 1,
        profile_status: 1,
      }
    )
    .exec(function (userErr, userData) {
      if (userData) {
        return res.json({ success: 1, userData: userData });
      } else {
        return res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

router.post("/profileupdate", common.tokenMiddleware, (req, res) => {
  var info = req.body;
  let fis = validator.isEmpty(info.firstname);
  let lst = validator.isEmpty(info.lastname);
  let add = validator.isEmpty(info.address);
  let cod = validator.isEmpty(info.zip_code);
  let cit = validator.isEmpty(info.city);
  info.DOB = new Date(info.DOB);
  info.profile_status = 1;
  if (!fis && !lst && !add && !cod && !cit) {
    users
      .updateOne({ _id: mongoose.mongo.ObjectId(req.userId) }, { $set: info })
      .exec(function (upErr, upRes) {
        if (upRes) {
          return res.json({ success: 1, userData: info });
        } else {
          return res.json({ success: 0, msg: "Something wents wrong !" });
        }
      });
  } else {
    return res.json({ success: 0, msg: "Enter all details !" });
  }
});

router.post(
  "/kycUpdate",
  upload.array("kycProof[]", 12),
  common.tokenMiddleware,
  function (req, res) {
    try {
      var info = req.body;
      users
        .findOne(
          { _id: mongoose.mongo.ObjectId(req.userId) },
          {
            _id: 0,
            kyc_status: 1,
            id_status: 1,
            selfie_status: 1,
            residence_status: 1,
            passport_status: 1,
          }
        )
        .exec(function (usererr, userData) {
          if (userData) {
            uploadKyc(req, function (imgArray) {
              var obj = {};
              if (
                userData.id_status == 0 ||
                userData.id_status == 1 ||
                userData.id_status == 2
              ) {
                if (
                  imgArray["id_prooffrnt"] != null &&
                  imgArray["id_prooffrnt"] != undefined &&
                  imgArray["id_proof1bak"] != null &&
                  imgArray["id_proof1bak"] != undefined
                ) {
                  obj["id_proof"] = imgArray["id_prooffrnt"];
                  obj["id_proof1"] = imgArray["id_proof1bak"];
                  obj["id_status"] = 1;
                }
              }
              if (
                userData.passport_status == 0 ||
                userData.passport_status == 1 ||
                userData.passport_status == 2
              ) {
                if (
                  imgArray["passport_proof"] != null &&
                  imgArray["passport_proof"] != undefined
                ) {
                  obj["passport_proof"] = imgArray["passport_proof"];
                  obj["passport_status"] = 1;
                }
              }
              if (
                userData.selfie_status == 0 ||
                userData.selfie_status == 1 ||
                userData.selfie_status == 2
              ) {
                if (
                  imgArray["selfie_proof"] != null &&
                  imgArray["selfie_proof"] != undefined
                ) {
                  obj["selfie_proof"] = imgArray["selfie_proof"];
                  obj["selfie_status"] = 1;
                }
              }
              if (
                userData.residence_status == 0 ||
                userData.residence_status == 1 ||
                userData.residence_status == 2
              ) {
                if (
                  imgArray["residence_proof"] != null &&
                  imgArray["residence_proof"] != undefined
                ) {
                  obj["residence_proof"] = imgArray["residence_proof"];
                  obj["residence_status"] = 1;
                }
              }
              if (
                obj.id_status == 1 ||
                obj.selfie_status == 1 ||
                obj.passport_status == 1 ||
                obj.residence_status == 1
              ) {
                obj["kyc_status"] = 1;
                users
                  .updateOne(
                    { _id: mongoose.mongo.ObjectId(req.userId) },
                    { $set: obj }
                  )
                  .exec(function (err, result) {
                    if (result) {
                      res.json({
                        success: 1,
                        msg: "KYC submitted succesfully",
                        data: obj,
                      });
                    } else {
                      res.json({
                        success: 0,
                        msg: "Something went wrong. Please try again",
                      });
                    }
                  });
              } else {
                res.json({ success: 0, msg: "Please upload valid documents" });
              }
            });
          } else {
            return res.json({ success: 0, msg: "undefined user !" });
          }
        });
    } catch (e) {
      console.log(e);
      return res.json({ success: 0, msg: "Something wents wrong !" });
    }
  }
);
function uploadKyc(req, callback) {
  var imgArray = [];
  if (req.files.length > 0) {
    let len = req.files.length;
    var j = 0;
    for (i = 0; i < len; i++) {
      cloudinary.uploadImage(req.files[i].path, function (imgRes) {
        if (imgRes != undefined) {
          var orgName = imgRes.original_filename;
          var checkPrf = orgName.substr(orgName.length - 14);
          var checkPrf1 = orgName.substr(orgName.length - 12);
          var checkPrf2 = orgName.substr(orgName.length - 15);
          if (checkPrf == "passport_proof") {
            var proofName = checkPrf;
          } else if (checkPrf2 == "residence_proof") {
            var proofName = checkPrf2;
          } else if (checkPrf1 == "selfie_proof") {
            var proofName = checkPrf1;
          } else {
            var proofName = checkPrf1;
          }
          imgArray[proofName] = imgRes.secure_url;
        }
        j = j + 1;
        if (len == j) {
          callback(imgArray);
        }
      });
    }
  } else {
    callback(imgArray);
  }
}

router.post("/getWalletAmt", common.tokenMiddleware, (req, res) => {
  var id = req.userId;
  var currency = req.body.currency;

  wallet
    .findOne({ user_id: id }, { wallet: 1, _id: 0 })
    .exec(function (err, resp) {
      if (err) {
        return res.json({ success: 0, msg: "Something wents wrong !" });
      }
      if (resp) {
        const data = resp.wallet.map((item) => ({
          currency: item.currency,
          amount: item.amount,
          locked: item.locked !== undefined ? item.locked : 0,
        }));
        res.json({ success: 1, msg: data });
      }
    });
});

router.get("/testAggr", (req, res) => {
  wallet
    .aggregate([
      { $unwind: "$wallet" },
      {
        $match: {
          "wallet.currency": "APE",
        },
      },
      {
        $group: {
          _id: "123",
          total: {
            $sum: "$wallet.amount",
          },
        },
      },
    ])
    .exec(function (err, resData) {
      res.json({ test: resData });
    });
});

router.post("/getFav", common.tokenMiddleware, (req, res) => {
  var id = req.userId;
  users
    .aggregate([
      { $match: { _id: mongoose.mongo.ObjectId(id) } },
      { $project: { user_favourites: 1, _id: 0 } },
      { $unwind: { path: "$user_favourites" } },
      {
        $lookup: {
          from: "gameList",
          localField: "user_favourites",
          foreignField: "game_name",
          as: "string",
        },
      },
      {
        $group: {
          _id: "$user_favourites",
          status: { $first: { $arrayElemAt: ["$string.status", 0] } },
          image: { $first: { $arrayElemAt: ["$string.image", 0] } },
        },
      },
      { $match: { status: 1 } },
    ])
    .exec(function (err, resData) {
      if (resData) {
        res.json({ success: 1, msg: resData });
      }
      if (err) {
        res.json({ success: 0, msg: "somthings wents wrong !" });
      }
    });
});

router.get("/getvaluBal", common.tokenMiddleware, (req, res) => {
  wallet
    .aggregate([
      { $match: { user_id: mongoose.mongo.ObjectId(req.userId) } },
      { $project: { wallet: { currency: 1, amount: 1, status: 1 } } },
    ])
    .exec(function (err, resData) {
      if (resData.length !== 0) {
        currency.find({}).exec(function (err, resp) {
          if (resp) {
            const filteredArr2 = resData[0].wallet.filter((obj2) => {
              const matchingObj1 = resp.find(
                (obj1) => obj1.currency === obj2.currency
              );
              return matchingObj1 && matchingObj1.status !== 0;
            });
            var activeWal = resData[0].wallet.filter((val) => val.status == 1);
            res.json({ success: 1, walData: activeWal });
          }
        });
      } else {
        res.json({ success: 0, msg: "somthing wents wrong" });
      }
    });
});

router.get("/getUsrinfo", common.tokenMiddleware, (req, res) => {
  var userid = req.userId;

  currency
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
      // {'$addFields': {'convertedTotal': {'$add': [{'$cond': [{'$eq': ['$_id', 'BNB']}, {'$divide': ['$totalProfit', wage.BNB]},0]},{'$cond': [{'$eq': ['$_id', 'BUSD']}, {'$divide': ['$totalProfit', wage.BUSD]}, 0]},{'$cond': [{'$eq': ['$_id', 'RGC']}, {'$divide': ['$totalProfit', wage.RGC]}, 0]}]}}},

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
          console.log("userInfo", resData);
          if (resData.length == 0) {
            gamelist
              .find({}, { _id: 0, game_name: 1 })
              .exec(function (Err, Res) {
                let Data = { gamecount: [] };
                common.gamecount(Res, userid, function (data) {
                  if (data) {
                    common.getcount(userid, function (response) {
                      if (response !== 0) {
                        res.json({
                          success: 1,
                          status: 1,
                          msg: response,
                          wages: 0,
                        });
                      } else {
                        res.json({
                          success: 0,
                          status: 2,
                          msg: "Something went wrong",
                        });
                      }
                    });
                  }
                });
              });
          } else {
            common.getcount(userid, function (response) {
              console.log(response != 0);
              if (response === 0) {
                res.json({
                  success: 0,
                  status: 5,
                  msg: "Something went wrong",
                });
              } else {
                res.json({
                  success: 1,
                  status: 4,
                  msg: response,
                  wages: resData[0].finalTotal,
                });
              }
            });
          }
          /*if(resData[0].finalTotal) {
					if(resData.length==0){
						gamelist.find({},{_id:0,game_name:1}).exec(function(Err,Res) {
							let Data = {"gamecount":[]};
			    		common.gamecount(Res,userid ,function(data) {
			    			if(data){
			    				common.getcount(userid,function(response) {
			    					if(response!=0){
											res.json({success:1,status:1,msg:response,wages:resData[0].finalTotal});
										}else{
											res.json({success:0,status:2,msg:"Something went wrong"});
										}
			    				})
			    			}
			    		})
			    	})
					}else{
						common.getcount(userid,function(response) {
							if(response!=0){
								res.json({success:1,status:3,msg:response,wages:resData[0].finalTotal});
							}else{
								res.json({success:0,msg:"Something went wrong"});
							}
						})
					}
			} else {
				common.getcount(userid,function(response) {
					if(response!=0){
						res.json({success:1,status:4,msg:response,wages:resData[0].finalTotal});
					}else{
						res.json({success:0,status:5,msg:"Something went wrong"});
					}
				})
			}*/
        });

      /*users.findOne({'_id':userid},{gamecount:1,wagered:1,_id:0}).exec(function(errs,resData){
			if(resData.gamecount.length==0){
				gamelist.find({},{_id:0,game_name:1}).exec(function(Err,Res) {
					let Data = {"gamecount":[]};
	    		common.gamecount(Res,userid ,function(data) {
	    			if(data){
	    				common.getcount(userid,function(response) {
	    					if(response!=0){
									res.json({success:1,msg:response});
								}else{
									res.json({success:0,msg:"Something went wrong"});
								}
	    				})
	    			}
	    		})
	    	})
			}else{

				common.getcount(userid,function(response) {
					if(response!=0){
						res.json({success:1,msg:response});
					}else{
						res.json({success:0,msg:"Something went wrong"});
					}
				})
			}
		})*/
    });
});

router.post("/check", (req, res) => {
  var id = "643feb97784aff5341161b62";

  gamelist.find({}, { _id: 0, game_name: 1 }).exec(function (Err, Res) {
    let Data = { gamecount: [] };
    common.gamecount(Res, id, function (data) {});
  });

  // currency.find({},{_id:0,currency:1}).exec(function(curErr,curRes) {
  // 	let Data = {"gamecount":[]};
  // 	common.wagecount(curRes,id ,function(data) {})
  // })
});

//kyc and tfa status
router.get("/Getstatus", common.tokenMiddleware, (req, res) => {
  users
    .findOne(
      { _id: mongoose.mongo.ObjectId(req.userId) },
      { tfa_status: 1, _id: 0, kyc_status: 1 }
    )
    .exec(function (userErr, userData) {
      if (userData) {
        return res.json({ success: 1, userData: userData });
      } else {
        return res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

//update user name
router.post("/updateUsername", common.tokenMiddleware, (req, res) => {
  var username = req.body.username;
  var userId = req.userId;
  users.findOne({ username: username }).exec(function (userErr, userData) {
    if (userData) {
      return res.json({ success: 0, msg: "Username already exists" });
    } else {
      users
        .updateOne({ _id: userId }, { $set: { username: username } })
        .exec(function (Err, Data) {
          if (Err) {
            return res.json({ success: 0, msg: "Something wents wrong !" });
          }
          if (Data) {
            return res.json({
              success: 1,
              msg: "Username Changed",
              userName: username,
            });
          } else {
            return res.json({ success: 1, msg: "Try again Later" });
          }
        });
    }
  });
});

//update profile img
router.post("/profileImg", common.tokenMiddleware, (req, res) => {
  var proImg = req.body.img;
  var userId = req.userId;
  users.findOne({ _id: userId }).exec(function (userErr, userData) {
    if (userData) {
      users
        .updateOne({ _id: userId }, { $set: { profileImg: proImg } })
        .exec(function (Err, Data) {
          if (Err) {
            return res.json({ success: 0, msg: "Something wents wrong !" });
          }
          if (Data) {
            return res.json({
              success: 1,
              msg: "Profile image Changed",
              data: proImg,
            });
          } else {
            return res.json({ success: 1, msg: "Try again Later" });
          }
        });
    } else {
      res.json({ success: 0, msg: "Something wents wrong !" });
    }
  });
});

//game status activate or deactivate
router.get("/gameStatus", (req, res) => {
  gamelist
    .find({}, { game_name: 1, _id: 0, status: 1 })
    .exec(function (userErr, userData) {
      if (userData) {
        return res.json({ success: 1, msg: userData });
      } else {
        res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

//game specific status activate or deactivate
router.post("/Specificgame", common.tokenMiddleware, (req, res) => {
  var name = req.body.name;
  gamelist
    .findOne({ game_name: name }, { game_name: 1, _id: 0, status: 1 })
    .exec(function (userErr, userData) {
      if (userData) {
        return res.json({ success: 1, msg: userData });
      } else {
        res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

//check cuurency status
router.post("/currStatus", common.tokenMiddleware, (req, res) => {
  var name = req.body.name;
  currency
    .findOne({ currency: name }, { status: 1, _id: 0 })
    .exec(function (userErr, userData) {
      if (userData) {
        return res.json({ success: 1, msg: userData });
      } else {
        res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

router.get("/siteInfo", (req, res) => {
  siteSettings.findOne({}).exec(function (err, site) {
    if (site.site_mode == "0") {
      return res.json({ success: 0 });
    } else {
      return res.json({ success: 1 });
    }
  });
});

router.get("/getsiteInfo", (req, res) => {
  siteSettings.findOne({}).exec(function (err, site) {
    if (site) {
      return res.json({ success: 1, msg: site });
    } else {
      return res.json({ success: 1, msg: "Please try again" });
    }
  });
});

//get all games (added in casino)

router.get("/casinoGames", (req, res) => {
  // var id=req.userId;
  gamelist
    .find()
    .then((res) => {
      console.log("hello", res);
    })
    .catch((err) => {
      console.log(error);
    });
  gamelist
    .aggregate([
      { $match: { status: 1 } },
      {
        $project: {
          gameName: "$game_name",
          Image: "$image",
          Status: "$status",
        },
      },
    ])
    .exec(function (err, resData) {
      if (resData) {
        res.json({ success: 1, msg: resData });
      }
      if (err) {
        res.json({ success: 0, msg: "Something wents wrong !" });
      }
    });
});

router.get("/DepositeHistory", common.userVerify, (req, res) => {
  var userId = req.userId;
  deposit
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .exec(function (err, data2) {
      if (data2) {
        res.json({
          success: 1,
          msg: "Deposit history success!",
          deposite: data2,
        });
      } else {
        res.json({ success: 0, msg: "Deposite data is undefind !" });
      }
    });
});

router.get("/withdrawHistory", common.userVerify, (req, res) => {
  var userId = req.userId;
  withdraw
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .exec(function (err, data2) {
      if (data2) {
        res.json({ success: 1, withdraw: data2 });
      } else {
        res.json({ success: 0, msg: "Withdraw data is undefind !" });
      }
    });
});

router.get("/getvip_lvl", (req, res) => {
  async.parallel(
    {
      BronzeVip: function (cb) {
        vipLvl.find({ type: "Bronze" }).exec(cb);
      },
      SilverVip: function (cb) {
        vipLvl.find({ type: "Silver" }).exec(cb);
      },
      GoldVip: function (cb) {
        vipLvl.find({ type: "Gold" }).exec(cb);
      },
      PlatinamIVip: function (cb) {
        vipLvl.find({ type: "Platinum I" }).exec(cb);
      },
      PlatinamIIVip: function (cb) {
        vipLvl.find({ type: "Platinum II" }).exec(cb);
      },
      DiamondIVip: function (cb) {
        vipLvl.find({ type: "Diamond I" }).exec(cb);
      },
      DiamondIIVip: function (cb) {
        vipLvl.find({ type: "Diamond II" }).exec(cb);
      },
      DiamondIIIVip: function (cb) {
        vipLvl.find({ type: "Diamond III" }).exec(cb);
      },
    },
    function (err, results) {
      let bron = results.BronzeVip;
      let silver = results.SilverVip;
      let gold = results.GoldVip;
      let plati1 = results.PlatinamIVip;
      let plati2 = results.PlatinamIIVip;
      let diamond1 = results.DiamondIVip;
      let diamond2 = results.DiamondIIVip;
      let diamond3 = results.DiamondIIIVip;
      res.json({
        success: 1,
        bronze: bron,
        silver: silver,
        gold: gold,
        platinam1: plati1,
        platinam2: plati2,
        diamond1: diamond1,
        diamond2: diamond2,
        diamond3: diamond3,
      });
    }
  );
});

router.get("/getVip", common.userVerify, (req, res) => {
  var userId = req.userId;
  users
    .findOne({ _id: mongoose.mongo.ObjectId(userId) })
    .exec(async function (userErr, userRes) {
      if (userRes) {
        common.GetTotalWager(userId, function (wagerAmt) {
          if (userRes.vip !== "VIP 0") {
            vipLvl
              .findOne({ level: userRes.vip })
              .exec(async function (vipErr, vipRes) {
                if (vipRes) {
                  /*var userwages= await users.aggregate([
		            {'$match': {'_id': mongoose.mongo.ObjectId(userId)}}, 
		            {'$unwind': '$gamecount'}, 
		            {'$group': {'_id': null, 'Wages': {'$sum': '$gamecount.Wages'}}}
		          ]).then((data)=>{
		            if(data){condata = data[0].Wages;}else{condata = 0}
		          })*/
                  var condata = wagerAmt;

                  if (vipRes.level !== "VIP 69") {
                    var vipname = vipRes.level.replace(/[^a-zA-Z]+/g, "");
                    var txt = vipRes.level;
                    var numb = txt.match(/\d/g).join("");
                    var nextlvl = vipname + " " + (Number(numb) + 1);
                  } else {
                    var nextlvl = "SVIP 1";
                  }
                  // let nextlvl = 'VIP '+(parseFloat((userRes.vip).substr(4))+1);
                  vipLvl
                    .findOne({ level: nextlvl })
                    .exec(async function (nxtErr, nxtRes) {
                      if (nxtRes) {
                        var nxtlvl = nxtRes.level;
                        var nxtXP = nxtRes.XP;
                        var balXp = nxtXP * 1 - condata * 1;
                      } else {
                        var nxtlvl = "SVIP 55";
                        var nxtXP = 0;
                        var balXp = 0;
                      }
                      let obj = {
                        TotalXP: condata,
                        level: vipRes.level,
                        type: vipRes.type,
                        XP: vipRes.XP,
                        nxtlvl: nxtlvl,
                        balnxtXp: balXp,
                      };
                      res.json({ success: 1, data: obj });
                    });
                } else {
                  res.json({ success: 0, msg: "somthing wents wrong !" });
                }
              });
          } else {
            var condata = wagerAmt;
            let obj = {
              TotalXP: condata,
              level: "VIP 0",
              type: "bronze",
              XP: 0,
              nxtlvl: "VIP 1",
              balnxtXp: 0,
            };
            res.json({ success: 1, data: obj });
          }
        });
      } else {
        res.json({ success: 0, msg: "somthing wents wrong !" });
      }
    });
});

router.get("/getgameInfo", common.userVerify, (req, res) => {
  gamelist.find({}, { game_name: 1, _id: 1 }).exec(function (errRes, resData) {
    if (resData) {
      res.json({ success: 1, msg: resData });
    }
    if (errRes) {
      res.json({ success: 0, msg: "Server error" });
    }
  });
});

router.post("/gameDetails", common.userVerify, (req, res) => {
  var name = req.body.gameName;
  if (name != "Global") {
    users
      .aggregate([
        {
          $match: { _id: mongoose.mongo.ObjectId(req.userId) },
        },
        {
          $project: {
            gamecount: {
              $filter: {
                input: "$gamecount",
                as: "gc",
                cond: { $eq: ["$$gc.name", name] },
              },
            },
            wagered: 1,
          },
        },
        { $unwind: { path: "$gamecount" } },
        {
          $group: {
            _id: "$_id",
            gamecount: { $push: "$gamecount" },
            totalSum: {
              $sum: {
                $add: ["$gamecount.BUSD", "$gamecount.BNB", "$gamecount.RGC"],
              },
            },
            totalbet: { $sum: { $add: ["$gamecount.total_count"] } },
            total_win: {
              $sum: { $add: ["$gamecount.total_win"] },
            },
            wagered: { $push: "$wagered" },
          },
        },
      ])
      .exec(function (resErr, resData) {
        if (resData) {
          var datas = resData[0].gamecount;
          var list = datas[0];
          currency
            .find({}, { currency: 1, _id: 0 })
            .exec(function (errs, data) {
              var result = [];
              Object.keys(list).forEach((key, index) => {
                data.forEach((value) => {
                  if (key === value.currency) {
                    var winList =
                      key == "RGC"
                        ? list.RGC_win
                        : key == "BNB"
                        ? list.BNB_win
                        : key == "BUSD"
                        ? list.BUSD_win
                        : list.JB_win;
                    result.push({
                      currency: key,
                      wages: list[key],
                      win: winList,
                      betAmount: list[`${key}_betamt`],
                    });
                  }
                });
              });
              // console.log(resData[0].totalSum)
              res.json({
                success: 1,
                msg: result,
                totalSum: resData[0].totalSum,
                totalbet: resData[0].totalbet,
                total_win: resData[0].total_win,
              });
            });
        }
        if (resErr) {
          res.json({ success: 0, msg: "Server error" });
        }
      });
  } else {
    users
      .aggregate([
        { $match: { _id: mongoose.mongo.ObjectId(req.userId) } },
        { $unwind: { path: "$gamecount" } },
        {
          $group: {
            _id: "$_id",
            RGCAmt: { $sum: "$gamecount.RGC_betamt" },
            BNBAmt: { $sum: "$gamecount.BNB_betamt" },
            BUSDAmt: { $sum: "$gamecount.BUSD_betamt" },
            RGCWin: { $sum: "$gamecount.RGC_win" },
            BNBWin: { $sum: "$gamecount.BNB_win" },
            BUSDWin: { $sum: "$gamecount.BUSD_win" },
            RGCWag: { $sum: "$gamecount.RGC" },
            BNBWag: { $sum: "$gamecount.BNBC" },
            BUSDWag: { $sum: "$gamecount.RGCBUSDT" },
            JBAmt: { $sum: "$gamecount.JB_betamt" },
            JBWin: { $sum: "$gamecount.JB_win" },
            JBWag: { $sum: "$gamecount.JBC" },
          },
        },
        {
          $project: {
            _id: 1,
            RGC: { bet: "$RGCAmt", win: "$RGCWin", wages: "$RGCWag" },
            BNB: { bet: "$BNBAmt", win: "$BNBWin", wages: "$BNBWag" },
            BUSDT: { bet: "$BUSDAmt", win: "$BUSDWin", wages: "$BUSDWag" },
            JBC: { bet: "$JBAmt", win: "$JBWin", wages: "$JBWag" },
          },
        },
      ])
      .exec(function (err, resp) {
        if (resp) {
          var result = [];
          resp.forEach((value) => {
            if (value.RGC) {
              result.push({
                currency: "RGC",
                win: value.RGC.win,
                betAmount: value.RGC.bet,
                wages: value.RGC.wages,
              });
            }
            if (value.BNB) {
              result.push({
                currency: "BNB",
                win: value.BNB.win,
                betAmount: value.BNB.bet,
                wages: value.BNB.wages,
              });
            }
            if (value.BUSDT) {
              result.push({
                currency: "BUSDT",
                win: value.BUSDT.win,
                betAmount: value.BUSDT.bet,
                wages: value.BUSDT.wages,
              });
            }
            if (value.JBC) {
              result.push({
                currency: "JBC",
                win: value.JBC.win,
                betAmount: value.JBC.bet,
                wages: value.JBC.wages,
              });
            }
          });
          res.json({ success: 1, msg: result });
        } else {
          res.json({ success: 0, msg: "Server error" });
        }

        if (err) {
          res.json({ success: 0, msg: "Server error" });
        }
      });
  }
});

router.get("/getNotifyData", common.userVerify, (req, res) => {
  notify
    .find({ status: 1, type: "system Notice" })
    .exec(function (err, resData) {
      if (err) {
        return res.json({ success: 0, msg: "Somthings wents wrong !" });
      }
      if (resData) {
        return res.json({ success: 1, NotifyData: resData });
      } else {
        return res.json({ success: 1, NotifyData: [] });
      }
    });
});

router.get("/getBlog", (req, res) => {
  blog.find({ status: 1 }).exec(function (err, resData) {
    if (resData) {
      return res.json({ success: 1, BlogData: resData });
    } else {
      return res.json({ success: 0, msg: "Somthings wents wrong !" });
    }
  });
});

router.post("/getBlogInfo", (req, res) => {
  var info = req.body;
  blog
    .findOne({ _id: mongoose.mongo.ObjectId(info.id) })
    .exec(function (err, resData) {
      if (resData) {
        return res.json({ success: 1, BlogData: resData });
      } else {
        return res.json({ success: 0, msg: "Somthings wents wrong !" });
      }
    });
});

router.get("/getBal", common.tokenMiddleware, (req, res) => {
  wallet
    .findOne(
      { user_id: mongoose.mongo.ObjectId(req.userId) },
      { _id: 0, wallet: 1 }
    )
    .exec(function (err, resData) {
      if (resData) {
        return res.json({ success: 1, BalData: resData.wallet });
      } else {
        return res.json({ success: 0, msg: "Somthings wents wrong !" });
      }
    });
});

router.get("/spinData", common.tokenMiddleware, (req, res) => {
  spinBonus
    .findOne(
      { user_id: mongoose.mongo.ObjectId(req.userId) },
      { created_at: 1, _id: 0 }
    )
    .sort({ created_at: -1 })
    .exec((spinErr, spinData) => {
      if (spinData) {
        return res.json({ success: 1, spinData: spinData.created_at });
      } else {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return res.json({ success: 1, spinData: d });
      }
    });
});

router.post("/luckwheel", common.tokenMiddleware, (req, res) => {
  var info = req.body;
  spinBonus
    .findOne({
      user_id: mongoose.mongo.ObjectId(req.userId),
      created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
    .exec((resErr, resData) => {
      if (resData) {
        return res.json({ success: 0, msg: "spining is not ready yet!" });
      } else {
        var list = [
          /*{curr: 'BUSD', amount:0.1, id:1},{curr: 'RGC', amount:0.1, id:2},
		    {curr: 'BNB', amount:0.001, id:3},{curr: 'BUSD', amount:0.5, id:4},
		    {curr: 'RGC', amount:0.001, id:5},{curr: 'BUSD', amount:1, id:6},
		    {curr: 'RGC', amount:0.5, id:7},{curr: 'BNB', amount:0.005, id:8},
		    {curr: 'BUSD', amount:1.5, id:9},{curr: 'RGC', amount:0.001, id:10},
		    {curr: 'BUSD', amount:0.001, id:11},{curr: 'RGC', amount:0.5, id:12},
		    {curr: 'BUSD', amount:0.5, id:13},{curr: 'BNB', amount:0.001, id:14},
		    {curr: 'RGC', amount:1.5, id:15},{curr: 'BUSD', amount:1, id:16},
		    {curr: 'RGC', amount:1, id:17},{curr: 'BNB', amount:0.005, id:18},*/

          { curr: "RGC", amount: 0.1, id: 1 },
          { curr: "BNB", amount: 0.001, id: 2 },
          { curr: "BUSD", amount: 0.5, id: 3 },
          { curr: "RGC", amount: 0.001, id: 4 },
          { curr: "BUSD", amount: 1, id: 5 },
          { curr: "RGC", amount: 0.5, id: 6 },
          { curr: "BNB", amount: 0.005, id: 7 },
          { curr: "BUSD", amount: 1.5, id: 8 },
          { curr: "RGC", amount: 0.001, id: 9 },
          { curr: "BUSD", amount: 0.5, id: 10 },
          { curr: "RGC", amount: 0.5, id: 11 },
          { curr: "BNB", amount: 0.001, id: 12 },
          { curr: "RGC", amount: 1.5, id: 13 },
          { curr: "BUSD", amount: 1, id: 14 },
          { curr: "RGC", amount: 1, id: 15 },
          { curr: "BNB", amount: 0.005, id: 16 },
        ];
        /*let arr1 = [3,8,14,18];let arr2 = [1,4,6,9,11,13,16];let arr3 = [2,5,7,10,12,15,17];
			var ranData = [...arr3, ...arr3, ...arr3, ...arr3, ...arr3, ...arr3];*/

        let arr1 = [2, 7, 12, 16];
        let arr2 = [3, 5, 8, 10, 14];
        let arr3 = [1, 4, 6, 9, 11, 13, 15];
        var ranData = [...arr3, ...arr3, ...arr3, ...arr3, ...arr3, ...arr3];

        var randomIndex = Math.floor(Math.random() * ranData.length);
        var randomItem = ranData[randomIndex];

        let index = list.findIndex((rank) => rank.id == randomItem);
        let resultData = list[index];
        var obj = {
          user_id: mongoose.mongo.ObjectId(req.userId),
          type: info.type,
          bonus: resultData.amount,
          currency: resultData.curr,
        };
        spinBonus.create(obj, function (spinErr, spinRes) {
          if (spinRes) {
            if (resultData.curr == "RGC") {
              wallet.updateOne(
                {
                  user_id: mongoose.mongo.ObjectId(req.userId),
                  "wallet.currency": resultData.curr,
                },
                { $inc: { "wallet.$.locked": resultData.amount } },
                (ers, doc) => {
                  if (doc) {
                    return res.json({ success: 1, LuckNum: randomItem });
                  } else {
                    return res.json({
                      success: 0,
                      msg: "Failed to updated balance !",
                    });
                  }
                }
              );
            } else {
              wallet.updateOne(
                {
                  user_id: mongoose.mongo.ObjectId(req.userId),
                  "wallet.currency": resultData.curr,
                },
                { $inc: { "wallet.$.amount": resultData.amount } },
                (ers, doc) => {
                  if (doc) {
                    return res.json({ success: 1, LuckNum: randomItem });
                  } else {
                    return res.json({
                      success: 0,
                      msg: "Failed to updated balance !",
                    });
                  }
                }
              );
            }
          } else {
            res.json({ success: 0, msg: "Failed to update Bonus!" });
          }
        });
      }
    });
});

router.get("/spinHis", (req, res) => {
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  var end = new Date();
  end.setHours(23, 59, 59, 999);
  spinBonus
    .aggregate([
      { $match: { created_at: { $gte: new Date(start), $lt: new Date(end) } } },
      {
        $lookup: {
          from: "user_info",
          localField: "user_id",
          foreignField: "_id",
          as: "userId",
        },
      },
      { $unwind: "$userId" },
      {
        $project: {
          type: 1,
          _id: 0,
          currency: 1,
          created_at: 1,
          bonus: 1,
          userName: "$userId.username",
        },
      },
    ])
    .then((data) => {
      if (data.length !== 0) {
        return res.json({ success: 1, history: data });
      } else {
        return res.json({ success: 1, history: [] });
      }
    });
});

router.post("/bonus", common.tokenMiddleware, function (req, res, next) {
  var info = req.body;
  var pageNo = parseInt(info.pageIndex) || 0;
  var size = parseInt(info.pageSize);
  var query = {};
  var response = {};
  query.skip = size * pageNo;
  query.limit = size;
  var search = { user_id: mongoose.mongo.ObjectId(req.userId) };

  async.parallel(
    {
      spinBonusCount: function (cb) {
        spinBonus.find(search).countDocuments().exec(cb);
      },
      spinBonusData: function (cb) {
        spinBonus.find(search, {}, query).sort({ _id: 1 }).exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      response.success = 1;
      response.BonusCount = results.spinBonusCount - 1;
      response.BonusData = results.spinBonusData;
      res.json(response);
    }
  );
});

router.get("/getBigWin", (req, res) => {
  currency
    .find({}, { _id: 0, currency: 1, market_price: 1 })
    .exec((err, resData) => {
      console.log(resData);
      var MartRGC = resData.filter((val) => val.currency == "RGC");
      var MartBNB = resData.filter((val) => val.currency == "BNB");
      var MartBUSD = resData.filter((val) => val.currency == "BUSD");
      var MartJB = resData.filter((val) => val.currency == "JBC");

      var mart = {
        RGC: MartRGC[0].market_price,
        BNB: MartBNB[0].market_price,
        BUSD: MartBUSD[0].market_price,
        JBC: MartJB[0].market_price,
      };
      async.parallel(
        {
          LimboWinner: function (cb) {
            betHis
              .aggregate([
                {
                  $match: {
                    game: "limbo",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/limbo-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          DiceWinner: function (cb) {
            betHis
              .aggregate([
                {
                  $match: {
                    game: "dice",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    Image: "assets/images/dice-g.png",
                    user_name: "$user.username",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          CoinFlipWinner: function (cb) {
            coinflipBetHis
              .aggregate([
                {
                  $match: {
                    game: "coinflip",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    Image: "assets/images/coinflip.png",
                    user_name: "$user.username",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          KenoWinner: function (cb) {
            kenoBetHis
              .aggregate([
                {
                  $match: {
                    game: "keno",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/keno-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          MinesWinner: function (cb) {
            minesBetHis
              .aggregate([
                {
                  $match: {
                    game: "mines",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/mines.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          WheelWinner: function (cb) {
            wheelBetHis
              .aggregate([
                {
                  $match: {
                    game: "wheel",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/wheel-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          FortuneWinner: function (cb) {
            fortuneBetHis
              .aggregate([
                {
                  $match: {
                    game: "wheel-of-fortune",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/fortune.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          RouletteWinner: function (cb) {
            rouletteBetHis
              .aggregate([
                {
                  $match: {
                    game: "roulette",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/roulette.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          SwordWinner: function (cb) {
            swordBetHis
              .aggregate([
                {
                  $match: {
                    game: "sword",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/sword-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          PlunderWinner: function (cb) {
            caveBetHis
              .aggregate([
                {
                  $match: {
                    game: "caveofplunder",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/plunder-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
          PlinkoWinner: function (cb) {
            plinkoBetHis
              .aggregate([
                {
                  $match: {
                    game: "plinko",
                    status: "winner",
                    created_at: {
                      $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/plinko.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .exec(cb);
          },
        },
        async function (err, results) {
          var bigWin = [];
          if (err) return res.status(500).send(err);

          if (results.LimboWinner.length == 0) {
            await betHis
              .aggregate([
                { $match: { game: "limbo", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/limbo-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.LimboWinner[0]);
          }

          if (results.DiceWinner.length == 0) {
            await betHis
              .aggregate([
                { $match: { game: "dice", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/dice-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.DiceWinner[0]);
          }

          if (results.CoinFlipWinner.length == 0) {
            await coinflipBetHis
              .aggregate([
                { $match: { game: "coinflip", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/coinflip.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.CoinFlipWinner[0]);
          }

          if (results.KenoWinner.length == 0) {
            await kenoBetHis
              .aggregate([
                { $match: { game: "keno", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/keno-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.KenoWinner[0]);
          }

          if (results.MinesWinner.length == 0) {
            await minesBetHis
              .aggregate([
                { $match: { game: "mines", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/mines.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.MinesWinner[0]);
          }

          if (results.WheelWinner.length == 0) {
            await wheelBetHis
              .aggregate([
                { $match: { game: "wheel", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/wheel-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.WheelWinner[0]);
          }

          if (results.FortuneWinner.length == 0) {
            await fortuneBetHis
              .aggregate([
                { $match: { game: "wheel-of-fortune", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/fortune.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.FortuneWinner[0]);
          }

          if (results.RouletteWinner.length == 0) {
            await rouletteBetHis
              .aggregate([
                { $match: { game: "roulette", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/roulette.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.RouletteWinner[0]);
          }

          if (results.SwordWinner.length == 0) {
            await swordBetHis
              .aggregate([
                { $match: { game: "sword", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/sword-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.SwordWinner[0]);
          }

          if (results.PlunderWinner.length == 0) {
            await caveBetHis
              .aggregate([
                { $match: { game: "caveofplunder", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/plunder-g.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.PlunderWinner[0]);
          }

          if (results.PlinkoWinner.length == 0) {
            await plinkoBetHis
              .aggregate([
                { $match: { game: "plinko", status: "winner" } },
                {
                  $lookup: {
                    from: "user_info",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                  },
                },
                { $unwind: "$user" },
                {
                  $project: {
                    bet_amount: 1,
                    currency: 1,
                    payout: 1,
                    win_lose_amt: 1,
                    game: 1,
                    user_name: "$user.username",
                    Image: "assets/images/plinko.png",
                    "Account Status": {
                      $cond: {
                        if: { $eq: ["RGC", "$currency"] },
                        then: {
                          $sum: { $multiply: ["$win_lose_amt", mart.RGC] },
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["BNB", "$currency"] },
                            then: {
                              $sum: { $multiply: ["$win_lose_amt", mart.BNB] },
                            },
                            else: {
                              $cond: {
                                if: { $eq: ["BUSD", "$currency"] },
                                then: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.BUSD],
                                  },
                                },
                                else: {
                                  $sum: {
                                    $multiply: ["$win_lose_amt", mart.JBC],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { "Account Status": -1 } },
              ])
              .then((data) => {
                if (data.length !== 0) {
                  bigWin.push(data[0]);
                }
              });
          } else {
            bigWin.push(results.PlinkoWinner[0]);
          }

          return res.json({ success: 1, BigWin: bigWin });
        }
      );
    });
});

router.post("/bigwinDetail", (req, res) => {
  var gameName = req.body.name;
  var gameId = req.body.gameid;
  var collection =
    gameName == "limbo" || gameName == "dice"
      ? betHis
      : gameName == "coinflip"
      ? coinflipBetHis
      : gameName == "keno"
      ? kenoBetHis
      : gameName == "mines"
      ? minesBetHis
      : gameName == "wheel"
      ? wheelBetHis
      : gameName == "wheel-of-fortune"
      ? fortuneBetHis
      : gameName == "roulette"
      ? rouletteBetHis
      : gameName == "sword"
      ? swordBetHis
      : gameName == "caveofplunder"
      ? caveBetHis
      : plinkoBetHis;
  collection.findOne({ _id: gameId }).exec(function (errData, resData) {
    if (resData) {
      return res.json({ success: 1, data: resData });
    } else {
      return res.json({ success: 0 });
    }
  });
});

router.post("/getlockedamt", common.tokenMiddleware, (req, res) => {
  var curr = req.body.curr;
  wallet
    .findOne(
      { user_id: mongoose.mongo.ObjectId(req.userId) },
      { wallet: { $elemMatch: { currency: curr } } }
    )
    .exec(function (err, resData) {
      if (resData) {
        if (resData.wallet.length > 0) {
          var obj = {
            amount: resData.wallet[0].amount,
            locked: resData.wallet[0].locked,
            currency: curr,
          };
          return res.json({ success: 1, locked: obj });
        } else {
          return res.json({ success: 0, msg: "wallet not defined !" });
        }
      } else {
        return res.json({ success: 0, msg: "account not found !" });
      }
    });
});

router.post("/unlockamt", common.tokenMiddleware, (req, res) => {
  var curr = req.body.curr;
  var wages = req.body.wages;
  if (wages >= 207800) {
    wallet
      .findOne(
        { user_id: mongoose.mongo.ObjectId(req.userId) },
        { wallet: { $elemMatch: { currency: curr } } }
      )
      .exec(function (err, resData) {
        if (resData) {
          if (resData.wallet.length > 0) {
            var walletData = resData.wallet[0];
            if (walletData.locked >= 5) {
              var updatamt =
                parseFloat(walletData.amount) + parseFloat(walletData.locked);
              wallet
                .updateOne(
                  {
                    user_id: mongoose.mongo.ObjectId(req.userId),
                    "wallet.currency": curr,
                  },
                  {
                    $set: {
                      "wallet.$.amount": +parseFloat(updatamt).toFixed(6),
                      "wallet.$.locked": +0,
                    },
                  },
                  { multi: true }
                )
                .exec(function (walErr, walData) {
                  if (walData) {
                    return res.json({
                      success: 1,
                      msg: "unlocked balance successfully !",
                    });
                  } else {
                    return res.json({
                      success: 0,
                      msg: "Failed to unlocked balance !",
                    });
                  }
                });
            } else {
              return res.json({ success: 0, msg: "Minimum to claim !" });
            }
          } else {
            return res.json({ success: 0, msg: "wallet not defined !" });
          }
        } else {
          return res.json({ success: 0, msg: "account not found !" });
        }
      });
  } else {
    return res.json({ success: 0, msg: "wages is not enouth to claim !" });
  }
});

router.post("/activityLog", common.tokenMiddleware, (req, res) => {
  var info = req.body;
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

  var search = { user_id: mongoose.mongo.ObjectId(req.userId) };

  async.parallel(
    {
      logCount: function (cb) {
        logs.find(search).countDocuments().exec(cb);
      },
      logData: function (cb) {
        logs.find(search, {}, query).sort({ created_at: -1 }).exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      res.json({
        success: 1,
        data: results.logData,
        logCount: results.logCount - 1,
      });
    }
  );
});

router.post("/getgraphed", common.userVerify, function (req, res) {
  var userid = req.userId;
  var time = req.body.time;
  var game = req.body.game;

  var collection =
    game == "wheel"
      ? wheelBetHis
      : game == "fortune"
      ? fortuneBetHis
      : game == "caveofplunder"
      ? caveBetHis
      : game == "limbo" || game == "dice"
      ? betHis
      : game == "coinflip"
      ? coinflipBetHis
      : game == "keno"
      ? kenoBetHis
      : game == "mines"
      ? minesBetHis
      : game == "roulette"
      ? rouletteBetHis
      : game == "plinko"
      ? plinkoBetHis
      : swordBetHis;

  async.parallel(
    {
      first: function (callback) {
        collection
          .aggregate([
            {
              $match: {
                user_id: mongoose.mongo.ObjectId(userid),
                game: game,
                time_status: 0,
                $expr: {
                  $eq: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$created_at",
                      },
                    },
                    { $dateToString: { format: "%Y-%m-%d", date: new Date() } },
                  ],
                },
              },
            },
            {
              $project: {
                bet_amount: "$bet_amount",
                _id: 0,
                profit: {
                  $cond: {
                    if: { $lte: ["$bet_amount", "$win_lose_amt"] },
                    then: { $multiply: ["$win_lose_amt", -1] },
                    else: "$win_lose_amt",
                  },
                },
              },
            },
          ])
          .exec(callback);
      },
      second: function (callback) {
        collection
          .aggregate([
            {
              $match: {
                user_id: mongoose.mongo.ObjectId(userid),
                game: game,
                time_status: 0,
                $expr: {
                  $eq: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$created_at",
                      },
                    },
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: new Date("Thu, 19 Oct 2023 05:18:11 GMT"),
                      },
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                wagered: { $sum: "$bet_amount" },
                profit: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "winner"] }, "$win_lose_amt", 0],
                  },
                },
                win: {
                  $sum: { $cond: [{ $eq: ["$status", "winner"] }, 1, 0] },
                },
                loss: {
                  $sum: { $cond: [{ $eq: ["$status", "loser"] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                pofit: "$profit",
                _id: 0,
                win: 1,
                loss: 1,
                wagered: 1,
              },
            },
          ])
          .exec(callback);
      },
    },
    function (err, resData) {
      if (resData) {
        return res.json({
          success: 1,
          msg: resData.first,
          profit: resData.second,
        });
      } else {
        return res.json({ success: 0, msg: "Something wents wrong !" });
      }
    }
  );
});

router.post("/getExacttime", common.userVerify, function (req, res) {
  var userid = req.userId;
  var game = req.body.game;
  var collection =
    game == "wheel"
      ? wheelBetHis
      : game == "fortune"
      ? fortuneBetHis
      : game == "caveofplunder"
      ? caveBetHis
      : game == "limbo" || game == "dice"
      ? betHis
      : game == "coinflip"
      ? coinflipBetHis
      : game == "keno"
      ? kenoBetHis
      : game == "mines"
      ? minesBetHis
      : game == "roulette"
      ? rouletteBetHis
      : game == "plinko"
      ? plinkoBetHis
      : swordBetHis;

  collection.updateMany(
    { user_id: userid, game: game },
    { $set: { time_status: 1 } },
    function (err, result) {
      if (err) {
        return res.json({ success: 0, msg: "Something wents wrong !" });
      }
      if (result) {
        return res.json({ success: 1, msg: "" });
      }
    }
  );
});

module.exports = router;

/*second:function(callback) {
	collection.aggregate([{'$match': {'user_id': mongoose.mongo.ObjectId(userid), 'game':game,
	'time_status':0,'$expr': {'$eq':[{'$dateToString':{'format':'%Y-%m-%d','date':
	'$created_at'}},{'$dateToString': {'format': '%Y-%m-%d', 'date': new Date()}}]}}}, {
	'$group':{'_id':null,'wagered':{'$sum':'$bet_amount'},'profit':{'$sum': '$win_lose_amt'}
	,'win': {'$sum': { '$cond': [{ '$eq': ["$status", "winner"] }, 1, 0] }},'loss':{'$sum':
	{ '$cond': [{ '$eq': ["$status", "loser"] }, 1, 0] }}}}, {'$project': {'pofit':'$profit' ,_id:0,win:1,loss:1,wagered:1}}]).exec(callback)
}*/
