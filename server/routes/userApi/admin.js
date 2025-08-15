var express = require("express");
var multer = require("multer");
var path = require("path");
var async = require("async");
let common = require("../../helpers/common");
var moment = require("moment");
var router = express.Router();
var mongoose = require("mongoose");
var ipInfo = require("ipinfo");
var useragent = require("useragent");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

var encdec = require("../../helpers/newendecryption");
var cloudinary = require("../../helpers/cloudinary");
var admin = require("../../model/admin");
var settings = require("../../model/siteSettings");
var adminhis = require("../../model/adminHistory");
var loginAttempts = require("../../model/loginAttempts");
var blockip = require("../../model/blockip");
var users = require("../../model/users");

const deposit = require("../../model/deposit");
const withdraw = require("../../model/withdraw");
const currency = require("../../model/currency");
const contact = require("../../model/support");
const coinNetwork = require("../../model/coinNetwork");
const wallet = require("../../model/userWallet");
const gamelist = require("../../model/gamelist");
const vip = require("../../model/vip_level");
const notify = require("../../model/notify");
const blog = require("../../model/blog");

var mail = require("../../helpers/mail");

// historyPage
const betHistory = require("../../model/bet_history");
const coinBetHis = require("../../model/coinflip_bethis");
const kenoBetHis = require("../../model/keno_bet_history");
const minesBetHis = require("../../model/mines_bethistory");
const rouletteBetHis = require("../../model/roulette_bethistory");
const wheelBetHis = require("../../model/wheel_result");
const fortuneBetHis = require("../../model/wheeloffortune");
const swordBetHis = require("../../model/sword_bethistory");
const caveBetHis = require("../../model/cave_bethistory");
const plinko = require("../../model/plinko_bethistory");
const crash = require("../../model/crash_bethistory");

// var item = require('../../model/item');
// var collection = require('../../model/collection');

var validator = require("validator");
const emailtemplate = require("../../model/emailtemplate");
//upload  storage
var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

let updatedDate = () => {
  return new Date();
};

let response = {};

router.get("/test", function (req, res, next) {
  res.json({ status: true, msg: "Test" });
});

router.get("/logs", (req, res) => {
  var path = require("path");
  var file = path.join(__dirname, "../../logs/combined.outerr-0.log");
  res.download(file);
});

router.get("/blockip", common.originMiddle, function (req, res, next) {
  // console.log(encdec.decryptNew("KKNrrWDfg7189r2RI6CjmQ=="))
  var agent = useragent.parse(req.headers["user-agent"]);
  let ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  ip = ip.replace("::ffff:", "");
  let obj = { ip_addr: ip };
  blockip.findOne({ ip: ip }).exec(function (error, resData) {
    if (resData) {
      res.json({ status: false, msg: "Ip blocked" });
    } else {
      res.json({ status: true, msg: "Ip not blocked" });
    }
  });
});

router.get("/check_ip", common.originMiddle, function (req, res) {
  var agent = useragent.parse(req.headers["user-agent"]);
  let ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  ip = ip.replace("::ffff:", "");
  blockip
    .find({ ip_addr: ip })
    .countDocuments()
    .exec(function (error, resData) {
      if (error) {
        return res.json({ success: 2 });
      } else if (resData != 0) {
        return res.json({ success: 1 });
      } else if (resData == 0) {
        return res.json({ success: 0 });
      }
    });
});

router.get("/check_maintain", common.originMiddle, function (req, res) {
  var agent = useragent.parse(req.headers["user-agent"]);
  let ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  ip = ip.replace("::ffff:", "");
  blockip.findOne({ ip_addr: ip }).exec(function (error, resData) {
    if (resData) {
      return res.json({ success: 2 });
    } else {
      return res.json({ success: 1 });
    }
  });
});

function Ipblock(info, res) {
  let ip = info.header("x-forwarded-for") || info.connection.remoteAddress;
  ip = ip.replace("::ffff:", "");
  var agent = useragent.parse(info.headers["user-agent"]);
  var os = agent.os.toString().split(" ")[0];
  var browser = agent.toAgent().split(" ")[0];

  var search = { emailid: info.body.email };
  async.parallel(
    {
      attemptRst: function (cb) {
        loginAttempts.findOne(search).select("attemptCount").exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      if (results.attemptRst != null) {
        if (results.attemptRst.attemptCount > 4) {
          let object = {
            ip_addr: ip,
            created_at: updatedDate(),
            status: 2,
          };
          blockip.create(object, function (err, result) {
            if (result) {
              response.status = 401;
              response.error = "Ip blocked";
              res.json(response);
            }
          });
        } else {
          loginAttempts
            .findOne({ ip_address: ip })
            .exec(function (error, resData) {
              if (resData) {
                let attemptCount = resData.attemptCount + 1;
                loginAttempts
                  .updateOne(
                    { _id: resData._id },
                    { $set: { attemptCount: +attemptCount, status: 0 } }
                  )
                  .exec(function (err, resUpdate) {});
              }
              response.status = false;
              response.error = "Invaild Email/Password or Pattern";
              res.json(response);
            });
        }
      } else {
        let attempt = {
          emailid: info.body.email,
          secret_key: info.body.password,
          ip_address: ip,
          browser: browser,
          deviceinfo: os,
          status: 0,
          datetime: updatedDate(),
        };
        loginAttempts.create(attempt, function (err, result) {
          if (result) {
            response.status = false;
            response.error = "Invaild Email/Password or Pattern";
            res.json(response);
          }
        });
      }
    }
  );
}

/* check admin login status. */
router.post("/chklogin", common.originMiddle, function (req, res, next) {
  let ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  ip = ip.replace("::ffff:", "");
  var agent = useragent.parse(req.headers["user-agent"]);
  var os = agent.os.toString().split(" ")[0];
  var browser = agent.toAgent().split(" ")[0];
  let ownermail = req.body.email;
  let password = encdec.encryptNew(req.body.password);
  let pattern = encdec.encryptNew(req.body.pattern);

  admin
    .findOne({
      $and: [{ ownermail: ownermail, ownerkey: password, pattern: pattern }],
    })
    .exec(function (error, resData) {
      if (error) {
        return next(error);
      }
      if (resData) {
        if (resData.status == 1) {
          let obj = {
            adminId: resData._id,
            ipaddress: ip,
            browser: browser,
            deviceinfo: os,
            status: 1,
          };
          adminhis.create(obj, function (err, result) {
            let Key = common.createPayload(resData._id);
            if (result) {
              loginAttempts
                .findOneAndRemove({ emailid: resData.ownermail })
                .exec(function (error, resData1) {
                  if (resData1) {
                    res.json({
                      status: 1,
                      Key: Key,
                      session: resData._id,
                      name: resData.username,
                      role: resData.role,
                      access_module: resData.access_module,
                      success: "You are logging in. Please Wait.",
                    });
                  } else {
                    res.json({
                      status: 1,
                      Key: Key,
                      session: resData._id,
                      name: resData.username,
                      role: resData.role,
                      success: "You are logging in. Please Wait.",
                    });
                  }
                });
            }
          });
        } else if (resData.status == 0) {
          response.status = false;
          response.error = "Your Account is deactivated.Please contact Admin!";
          res.json(response);
        }
      } else {
        Ipblock(req, res);
      }
    });
});

router.get("/profile", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  admin
    .findOne({ _id: id }, { ownermail: 1, username: 1, profileimg: 1 })
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true, data: resData });
      } else {
        return res.json({ status: false });
      }
    });
});

router.get("/moduleaccess", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  admin
    .findOne({ _id: id })
    .select("access_module role")
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true, data: resData });
      } else {
        return res.json({ status: false });
      }
    });
});

router.get("/admin_access", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  admin
    .findOne({ _id: id }, { _id: 0 })
    .select("access_module role")
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true, data: resData });
      } else {
        return res.json({ status: false });
      }
    });
});

router.post(
  "/updateProfile",
  common.tokenMiddleware,
  upload.single("profileImg"),
  function (req, res) {
    let info = req.body;
    uploadProfile(req, function (value) {
      updateProfile(info, value, req, res);
    });
  }
);

function uploadProfile(req, callback) {
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
}

function updateProfile(info, uploadImg, req, res) {
  let obj = { username: info.username, modifiedDate: updatedDate() };
  if (typeof uploadImg != "undefined" && typeof uploadImg != undefined) {
    obj["profileimg"] = uploadImg;
  }
  admin
    .findOneAndUpdate({ _id: info._id }, { $set: obj }, { multi: true })
    .exec(function (err, resUpdate) {
      if (resUpdate) {
        res.json({
          status: true,
          msg: "Successfully updated",
          data: uploadImg,
        });
      } else {
        res.json({ status: false, msg: "Invalid request. Please Try again" });
      }
    });
}

router.post("/loghistory", common.originMiddle, function (req, res, next) {
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

  // search
  var search = {};
  var regex = new RegExp(filter, "i");
  if (filter != "") {
    var fl = filter.toLowerCase();
    if (moment(filter, "YYYY-MM-DD h:mm:ss").isValid()) {
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
          { ipaddress: regex },
          { browser: regex },
          { deviceinfo: regex },
          { datetime: { $gte: new Date(newDate), $lt: new Date(newDate1) } },
        ],
      };
    } else {
      search = {
        $or: [{ ipaddress: regex }, { browser: regex }, { deviceinfo: regex }],
      };
    }
  } else {
    search = {
      $or: [{ ipaddress: regex }, { browser: regex }, { deviceinfo: regex }],
    };
  }
  async.parallel(
    {
      logCount: function (cb) {
        adminhis.find(search).countDocuments().exec(cb);
      },
      logData: function (cb) {
        adminhis
          .find(
            search,
            { ipaddress: 1, browser: 1, deviceinfo: 1, datetime: 1 },
            query
          )
          .exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      response.status = true;
      response.data = results.logData;
      response.logCount = results.logCount;
      res.json(response);
    }
  );
});

router.get("/settings", common.originMiddle, (req, res) => {
  settings.findOne({}).exec(function (error, resData) {
    if (resData) {
      res.json({ status: true, data: resData });
    } else {
      return res.json({ status: false });
    }
  });
});

router.get("/get_site", common.originMiddle, (req, res) => {
  settings
    .findOne(
      {},
      {
        _id: 0,
        site_name: 1,
        facebook: 1,
        twitter: 1,
        linkedin: 1,
        contact_mail: 1,
        copyright: 1,
        telegram: 1,
      }
    )
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true, data: resData });
      } else {
        return res.json({ status: false });
      }
    });
});

router.get("/get_contact", common.originMiddle, (req, res) => {
  settings
    .findOne(
      {},
      {
        _id: 0,
        contact_mail: 1,
        contactnumber: 1,
        address: 1,
        singleToken: 1,
        multipleToken: 1,
        singleCoin: 1,
        multipleCoin: 1,
      }
    )
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true, data: resData });
      } else {
        return res.json({ status: false });
      }
    });
});

// update settings
router.post(
  "/site_settings",
  common.tokenMiddleware,
  function (req, res, next) {
    let info = req.body;
    info.updated_at = updatedDate();
    settings.updateOne({}, { $set: info }).exec(function (err, results) {
      if (err) {
        console.log(err);
        return res.json({
          status: false,
          msg: "Something went wrong. Please try again",
        });
      }
      // Check if any document was actually modified
      if (results && (results.nModified > 0 || results.modifiedCount > 0)) {
        res.json({ status: true, msg: "Successfully updated", data: info });
      } else {
        // If no document was updated, try to insert a new one (upsert)
        settings
          .updateOne({}, { $set: info }, { upsert: true })
          .exec(function (upErr, upRes) {
            if (upErr) {
              console.log(upErr);
              return res.json({
                status: false,
                msg: "Something went wrong. Please try again",
              });
            }
            res.json({
              status: true,
              msg: "Successfully updated (upserted)",
              data: info,
            });
          });
      }
    });
  }
);

router.post("/updatePass", common.tokenMiddleware, (req, res) => {
  var request = req.body;
  let userId = req.userId;
  admin
    .findOne({ _id: userId })
    .select("ownerkey")
    .exec(function (PassErr, PassRes) {
      if (PassRes) {
        let encryptedcurpass = encdec.encryptNew(request.curpass);
        if (PassRes.ownerkey == encryptedcurpass) {
          let encryptepass = encdec.encryptNew(request.newpass);
          admin
            .findOneAndUpdate(
              { _id: userId },
              { $set: { ownerkey: encryptepass } },
              { multi: true }
            )
            .exec(function (err, resUpdate) {
              if (resUpdate) {
                res.json({
                  status: true,
                  msg: "Successfully updated",
                  id: userId,
                });
              } else {
                res.json({
                  status: false,
                  msg: "Password is not updated. Please Try again",
                });
              }
            });
        } else {
          res.json({ status: false, msg: "Current password is wrong" });
        }
      }
    });
});

router.post("/updatePat", common.tokenMiddleware, (req, res) => {
  var request = req.body;
  let userId = req.userId;
  admin
    .findOne({ _id: userId })
    .select("pattern")
    .exec(function (PassErr, PassRes) {
      if (PassRes) {
        let encryptedcurpattern = encdec.encryptNew(request.curpattern);
        if (PassRes.pattern == encryptedcurpattern) {
          let encryptepattern = encdec.encryptNew(request.newpattern);
          admin
            .findOneAndUpdate(
              { _id: userId },
              { $set: { pattern: encryptepattern } },
              { multi: true }
            )
            .exec(function (err, resUpdate) {
              if (resUpdate) {
                res.json({
                  status: true,
                  msg: "Successfully updated",
                  id: userId,
                });
              } else {
                res.json({
                  status: false,
                  msg: "Pattern is not updated. Please Try again",
                });
              }
            });
        } else {
          res.json({ status: false, msg: "Current Pattern is wrong" });
        }
      }
    });
});

router.post("/chkreset", common.tokenMiddleware, (req, res) => {
  var request = req.body;
  admin
    .findOne({ reset_code: request.rest_code })
    .exec(function (error, resData) {
      if (resData) {
        res.json({ status: true });
      } else {
        res.json({ status: false, msg: "Invalid Link" });
      }
    });
});

router.post("/addSubadmin", (req, res) => {
  var info = req.body;
  admin
    .findOne({ $or: [{ ownermail: info.email }, { username: info.username }] })
    .exec(function (error, existData) {
      if (error) {
        res.json({ status: false, msg: "Email/Username already exist!" });
      }
      if (existData) {
        res.json({ status: false, msg: "Email/Username already exist!" });
      } else {
        let password = encdec.encryptNew(info.token);
        let pattern = encdec.encryptNew(info.patternlock);
        var obj = {
          username: info.username,
          ownermail: info.email,
          ownerkey: password,
          role: 2,
          access_module: info.access,
          status: info.status,
          pattern: pattern,
        };
        admin.create(obj, function (err, result) {
          if (result) {
            var to = info.email;
            var specialVars = {
              "###USER###": info.username,
              "###CREATED_AT###": moment().format("ll"),
            };
            mail.sendMail(
              to,
              "create_subadmin",
              specialVars,
              function (mailRes) {}
            );
            res.json({ status: true, msg: "Successfully created" });
          } else {
            res.json({
              status: false,
              msg: "Something went wrong. Please try again",
            });
          }
        });
      }
    });
});

router.get("/subadmin", common.tokenMiddleware, (req, res) => {
  admin
    .find({ role: 2 })
    .sort({ createdDate: -1 })
    .exec(function (error, resData) {
      if (error) {
        return next(error);
      }
      res.json({ status: true, data: resData });
    });
});

router.get("/editSubadmin/:id", common.originMiddle, (req, res) => {
  var id = req.params.id;
  admin.findOne({ _id: id }).exec(function (error, resData) {
    if (error) {
      return next(error);
    }
    if (resData) {
      res.json({ status: true, data: resData });
    } else {
      res.json({ status: false, msg: "Invalid request. Please Try again" });
    }
  });
});

router.post("/updateSubadmin", common.tokenMiddleware, (req, res) => {
  let info = req.body;
  let obj = { access_module: info.access, modifiedDate: updatedDate() };
  admin
    .updateOne({ _id: info._id }, { $set: obj })
    .exec(function (err, resUpdate) {
      if (resUpdate.nModified == 1) {
        response = { status: true, msg: "Successfully updated" };
      } else {
        response = { status: false, msg: "Invalid request. Please try again" };
      }
      res.json(response);
    });
});

router.post("/adminStatus", common.tokenMiddleware, (req, res) => {
  let info = req.body;
  let sts = info.status == 1 ? 0 : 1;
  let obj = { status: sts, modifiedDate: updatedDate() };
  admin
    .findOneAndUpdate({ _id: info._id }, { $set: obj }, { multi: true })
    .exec(function (err, resUpdate) {
      if (resUpdate) {
        response = { status: true, msg: "Successfully updated" };
      } else {
        response = { status: false, msg: "Invalid request. Please try again" };
      }
      res.json(response);
    });
});

router.get("/adminDelete/:id", common.originMiddle, (req, res) => {
  var id = req.params.id;
  admin.findOneAndRemove({ _id: id }).exec(function (err, resData) {
    if (resData) {
      res.json({ status: true, msg: "Successfully deleted" });
    } else {
      res.json({
        status: false,
        msg: "Something went wrong. Please try again",
      });
    }
  });
});

// router.get('/adminDashboard', common.tokenMiddleware, (req, res) => {
// 	async.parallel({
// 		usersCount:function(cb) {
// 			users.find({}).countDocuments().exec(cb)
// 		},itemCount:function(cb) {
// 			item.find({}).countDocuments().exec(cb)
// 		},collectionCount:function(cb) {
// 			collection.find({}).countDocuments().exec(cb)
// 		},
// 	},function(err,results){
// 		if (err) return res.status(500).send(err);
// 		response.status    = true;
// 		response.totalusers = results.usersCount;
// 		response.totalItem = results.itemCount;
// 		response.totalCollection = results.collectionCount;
// 		res.json(response);
// 	})
// });

router.get("/adminDashboard", common.tokenMiddleware, (req, res) => {
  async.parallel(
    {
      UserCount: function (cb) {
        users.find({}).countDocuments().exec(cb);
      },
      gameCount: function (cb) {
        gamelist.find({}).countDocuments().exec(cb);
      },
      depositCount: function (cb) {
        deposit.find({}).countDocuments().exec(cb);
      },
      withdrawCount: function (cb) {
        withdraw.find({}).countDocuments().exec(cb);
      },
      currencyCount: function (cb) {
        currency.find({}).countDocuments().exec(cb);
      },
      contactUsCount: function (cb) {
        contact.find({ Status: 0 }).countDocuments().exec(cb);
      },
      kycPending: function (cb) {
        users.find({ kyc_status: 1 }).countDocuments().exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      response.status = true;
      response.userCount = results.UserCount;
      response.gameCount = results.gameCount;
      response.totalDepositComplete = results.depositCount;
      response.totalWithdrawComplete = results.withdrawCount;
      response.NumberOfCurrency = results.currencyCount;
      response.NumberOfContact = results.contactUsCount;
      response.kycPending = results.kycPending;
      res.json(response);
    }
  );
});

//changr password
router.post("/changepattern", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  let info = req.body;

  admin.findOne({ _id: id }).exec(function (resErr, resData) {
    if (resData) {
      if (info.confirmPattern !== null && info.confirmPattern !== undefined) {
        let pattern = encdec.decryptNew(resData.pattern);
        if (pattern === info.confirmPattern) {
          return res.json({
            status: 0,
            msg: "old pattern is equal to new match",
          });
        } else {
          let ptn = encdec.encryptNew(info.confirmPattern);
          let obj = { pattern: ptn };
          admin.updateOne({ _id: id }, { $set: obj }, function (err, respat) {
            if (respat) {
              res.json({
                status: 1,
                msg: "Admin password changed Successfully",
              });
            } else {
              res.json({ status: 0, msg: "Somthing wents wrong !" });
            }
          });
        }
      } else {
        res.json({ status: 0, msg: "change-pattern is invalid !" });
      }
    } else {
      res.json({ status: 0, msg: "admin undefined !" });
    }
  });
});

router.post("/changePassword", common.tokenMiddleware, (req, res) => {
  let id = req.userId;
  var info = req.body;

  admin.findOne({ _id: id }).exec(function (resErr, resData) {
    if (resData) {
      if (
        info.confirmPassword !== undefined &&
        info.newPassword !== undefined &&
        info.oldPassword !== undefined &&
        info.confirmPassword !== null &&
        info.newPassword !== null &&
        info.oldPassword !== null
      ) {
        if (
          info.confirmPassword.toString().length > 0 &&
          info.newPassword.toString().length > 0 &&
          info.oldPassword.toString().length > 0
        ) {
          let oldPass = encdec.encryptNew(info.oldPassword);
          admin.findOne({ ownerkey: oldPass }).exec(function (oldErr, oldData) {
            if (oldData) {
              let lowerChars = /[a-z]/g;
              let upperChars = /[A-Z]/g;
              let numbers = /[0-9]/g;
              let specials = /\W|_/g;
              if (
                info.newPassword.toString().length >= 8 &&
                info.newPassword.match(lowerChars) &&
                info.newPassword.match(upperChars) &&
                info.newPassword.match(numbers) &&
                info.newPassword.match(specials)
              ) {
                if (info.newPassword == info.confirmPassword) {
                  let newPass = encdec.encryptNew(info.newPassword);
                  admin
                    .findOne({ ownerkey: newPass })
                    .exec(function (newErr, newData) {
                      if (newData) {
                        res.json({
                          status: 0,
                          msg: "The new password is already use",
                        });
                      } else {
                        let obj = { ownerkey: newPass };
                        admin
                          .updateOne({ _id: id }, { $set: obj })
                          .exec(function (resetErr, resetPass) {
                            if (resetPass) {
                              res.json({
                                status: 1,
                                msg: "Admin password changed Successfully",
                              });
                            } else {
                              res.json({
                                status: 0,
                                msg: "Somthing wents wrong !",
                              });
                            }
                          });
                      }
                    });
                } else {
                  res.json({ status: 0, msg: "Password does not match" });
                }
              } else {
                res.json({ status: 0, msg: "Invalid password" });
              }
            } else {
              res.json({ status: 0, msg: "The old password is wrong" });
            }
          });
        } else {
          res.json({ status: 0, msg: "change-password is invalid !" });
        }
      } else {
        res.json({ status: 0, msg: "change-password is invalid !" });
      }
    } else {
      res.json({ status: 0, msg: "admin undefined !" });
    }
  });
});

router.post("/oldpassCheck", common.tokenMiddleware, (req, res) => {
  let oldPass = encdec.encryptNew(req.body.pass);
  admin.findOne({ ownerkey: oldPass }).exec(function (err, oldData) {
    if (oldData) {
      res.json({ status: 1, msg: "old password is matched" });
    } else {
      res.json({ status: 0 });
    }
  });
});

router.post("/CurrMatchCheck", common.tokenMiddleware, (req, res) => {
  let curr = req.body.currency.toUpperCase();
  currency.findOne({ currency: curr }).exec(function (err, oldData) {
    if (oldData) {
      res.json({ status: 0, msg: "Currency matched" });
    } else {
      res.json({ status: 1 });
    }
  });
});

router.post("/patternOld", common.tokenMiddleware, (req, res) => {
  let pattern = req.body.pattern;
  admin
    .findOne({ _id: req.userId }, { pattern: 1, _id: 0 })
    .exec(function (err, oldData) {
      if (oldData) {
        var decptPattern = encdec.decryptNew(oldData.pattern);
        if (pattern == decptPattern) {
          res.json({ status: 1, msg: "old patterm is matched" });
        } else {
          res.json({ status: 0, msg: "old password is not-matched" });
        }
      } else {
        res.json({ status: 0, msg: "Try again" });
      }
    });
});

router.post("/SendSupportReply", common.tokenMiddleware, (req, res) => {
  var Id = req.body.Id;
  var reply = req.body.admin_reply;

  if (reply !== undefined && reply !== null && reply.toString().length > 0) {
    contact
      .findOne({ _id: mongoose.mongo.ObjectId(Id) })
      .exec(function (err, findcont) {
        if (findcont) {
          // var url = 'http://localhost:4200';
          var usermail = findcont.email;
          var specialVars = {
            "###USERNAME###": findcont.userName,
            "###QUESTION##.": findcont.Query,
            "###CONTENT###": reply,
          };
          mail.sendMail(
            usermail,
            "support_ticket_mail",
            specialVars,
            function (mailRes) {
              if (mailRes) {
                let obj = { admin_reply: reply, Status: 1 };
                contact
                  .updateOne(
                    { _id: mongoose.mongo.ObjectId(Id) },
                    { $set: obj }
                  )
                  .exec(function (err, updcont) {
                    if (updcont) {
                      res.json({ status: 1, msg: "Admin Replied Succesfully" });
                    } else {
                      res.json({ status: 0, msg: "Failed to reply" });
                    }
                  });
              } else {
                res.json({ status: 0, msg: "Something went wrong" });
              }
            }
          );
        } else {
          res.json({ status: 0, msg: "sopport not defined" });
        }
      });
  } else {
    res.json({ status: 0, msg: "Admin reply is Invalid !" });
  }
});

router.post("/AddNewCurr", common.tokenMiddleware, (req, res) => {
  var newCurr = req.body;
  newCurr.currency = newCurr.currency.toUpperCase();
  currency
    .findOne({ currency: newCurr.currency })
    .exec(function (err, oldData) {
      if (oldData) {
        res.json({ status: 0, msg: "Currency already exists" });
      } else {
        if (
          newCurr.currency !== undefined &&
          newCurr.max_bet !== undefined &&
          newCurr.max_deposit !== undefined &&
          newCurr.max_withdraw !== undefined &&
          newCurr.min_bet !== undefined &&
          newCurr.min_deposit !== undefined &&
          newCurr.min_withdraw !== undefined &&
          newCurr.withdraw_fee !== undefined
        ) {
          if (
            newCurr.currency !== null &&
            newCurr.max_bet !== null &&
            newCurr.max_deposit !== null &&
            newCurr.max_withdraw !== null &&
            newCurr.min_bet !== null &&
            newCurr.min_deposit !== null &&
            newCurr.min_withdraw !== null &&
            newCurr.withdraw_fee !== null
          ) {
            if (
              newCurr.currency !== "" &&
              newCurr.max_bet !== "" &&
              newCurr.max_deposit !== "" &&
              newCurr.max_withdraw !== "" &&
              newCurr.min_bet !== "" &&
              newCurr.min_deposit !== "" &&
              newCurr.min_withdraw !== "" &&
              newCurr.withdraw_fee !== ""
            ) {
              if (newCurr.currency.length >= 3) {
                var checkNum = /^\d{0,50}(\.\d{1,8})?$/;
                if (/^[a-zA-Z]+$/.test(newCurr.currency)) {
                  if (
                    checkNum.test(newCurr.max_bet) &&
                    checkNum.test(newCurr.max_deposit) &&
                    checkNum.test(newCurr.max_withdraw) &&
                    checkNum.test(newCurr.min_bet) &&
                    checkNum.test(newCurr.min_deposit) &&
                    checkNum.test(newCurr.min_withdraw) &&
                    checkNum.test(newCurr.withdraw_fee)
                  ) {
                    var contype = newCurr.connecttype;
                    currency.create(newCurr, function (err, result) {
                      if (result) {
                        if (newCurr.network == "dummy") {
                          var walletAct = 0;
                        } else {
                          var walletAct = 1;
                        }
                        wallet
                          .updateMany(
                            {},
                            {
                              $push: {
                                wallet: {
                                  currency: newCurr.currency,
                                  amount: 0,
                                  status: walletAct,
                                },
                              },
                            }
                          )
                          .exec(function (walErr, walRes) {
                            if (walRes) {
                              res.json({
                                status: 1,
                                msg: "Currency Created Successfully",
                              });
                            } else {
                              res.json({
                                status: 0,
                                msg: "Failed to create user wallet currency !",
                              });
                            }
                          });
                      } else {
                        res.json({
                          status: 0,
                          msg: "Failed to create currency !",
                        });
                      }
                    });
                  } else {
                    res.json({ status: 0, msg: "Invalid Details !" });
                  }
                } else {
                  res.json({ status: 0, msg: "currency name invalid" });
                }
              } else {
                res.json({ status: 0, msg: "Currency atleast 3 characters" });
              }
            } else {
              res.json({ status: 0, msg: "Currency details invalid" });
            }
          } else {
            res.json({ status: 0, msg: "Currency details invalid" });
          }
        } else {
          res.json({ status: 0, msg: "Currency details invalid" });
        }
      }
    });
});

router.post("/ManageCurrency", common.tokenMiddleware, (req, res) => {
  var id = req.body.Id;
  var info = req.body;
  currency.findOne({ _id: id }).exec(function (err, currData) {
    if (currData) {
      if (
        info.min_bet !== "" &&
        info.max_bet !== "" &&
        info.min_deposit !== "" &&
        info.max_deposit !== "" &&
        info.min_withdraw !== "" &&
        info.max_withdraw !== "" &&
        info.withdraw_fee !== ""
      ) {
        var checkNum = /^\d{0,50}(\.\d{1,8})?$/;
        if (
          checkNum.test(info.min_bet) &&
          checkNum.test(info.max_bet) &&
          checkNum.test(info.min_deposit) &&
          checkNum.test(info.max_deposit) &&
          checkNum.test(info.min_withdraw) &&
          checkNum.test(info.max_withdraw) &&
          checkNum.test(info.withdraw_fee)
        ) {
          var contype = currData.connecttype;
          currency
            .updateOne({ _id: id }, { $set: info })
            .exec(function (resetErr, resetPass) {
              if (resetPass) {
                res.json({ status: 1, msg: "Currency Update Successfully" });
              } else {
                res.json({ status: 0, msg: "Something wents wrong !" });
              }
            });
        } else {
          res.json({ status: 0, msg: "decimal invalid" });
        }
      } else {
        res.json({ status: 0, msg: "Currency details invalid" });
      }
    } else {
      res.json({ status: 0, msg: "Currency is not defined" });
    }
  });
});

router.get("/getFirstCurr", common.tokenMiddleware, (req, res) => {
  currency.find({}, { _id: 0, currency: 1 }).exec(function (err, currData) {
    if (currData) {
      var finalArray = currData.map(function (obj) {
        return obj.currency;
      });
      res.json({ status: 1, FrtCurr: finalArray });
    } else {
      res.json({ status: 0, msg: "Currency is not defined" });
    }
  });
});

router.post("/getSecondCurr", common.tokenMiddleware, (req, res) => {
  var firstCurr = req.body.firstCurr;
  currency.find({ currency: firstCurr }).exec(function (err, currData) {
    if (currData) {
      currency
        .find({ network: currData[0].network })
        .exec(function (err1, currNetwork) {
          if (currNetwork) {
            var secondArray = currNetwork.map(function (obj) {
              return obj.currency;
            });
            var arr = secondArray.filter((item) => item !== firstCurr);
            res.json({ status: 1, SecCurr: arr });
          } else {
            res.json({ status: 0, msg: "Currency network is not defined" });
          }
        });
    } else {
      res.json({ status: 0, msg: "Currency is not defined" });
    }
  });
});

router.post("/Tfadisable", common.tokenMiddleware, (req, res) => {
  var encuId = encdec.decryptNew(req.body.userId);
  try {
    var info = req.body;
    users
      .findOne(
        { _id: mongoose.mongo.ObjectId(encuId) },
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
          var usermail =
            encdec.decryptNew(userRes.luck_value) +
            encdec.decryptNew(userRes.added_value);
          var qrName = `ROLLGAME (${usermail})`;
          var secret = speakeasy.generateSecret({ length: 10, name: qrName });
          var tfaCode = secret.base32;
          var tfaUrl = secret.otpauth_url;
          var url = tfaUrl.replace(tfaCode, "");
          var updateVal = {
            tfa_status: 0,
            tfa_code: encdec.withEncrypt(tfaCode),
            tfa_url: url,
            tfa_update: Date.now(),
          };
          users
            .updateOne(
              { _id: mongoose.mongo.ObjectId(encuId) },
              { $set: updateVal }
            )
            .exec(function (err, upRes) {
              if (upRes) {
                return res.json({
                  success: 1,
                  msg: "successfully disabled TFA",
                });
              } else {
                return res.json({ success: 0, msg: "Please try again" });
              }
            });
        } else {
          return res.json({ success: 0, msg: "Something wents wrong !" });
        }
      });
  } catch (e) {
    return res.json({ success: 0, msg: "Something wents wrong !" });
  }
});

router.post("/UsersAct", common.tokenMiddleware, (req, res) => {
  var encuId = encdec.decryptNew(req.body.userId);
  var type = req.body.type;
  try {
    var info = req.body;
    users
      .findOne({ _id: mongoose.mongo.ObjectId(encuId) }, { _id: 0, status: 1 })
      .exec(function (err, userRes) {
        if (userRes) {
          var updateVal = type == "open" ? 1 : 0;
          var msgthrow =
            type == "open"
              ? "successfully Activated User"
              : "successfully Deactivated User";
          users
            .updateOne(
              { _id: mongoose.mongo.ObjectId(encuId) },
              { $set: { status: updateVal } }
            )
            .exec(function (err, upRes) {
              if (upRes) {
                return res.json({ success: 1, msg: msgthrow });
              } else {
                return res.json({ success: 0, msg: "Please try again" });
              }
            });
        } else {
          return res.json({ success: 0, msg: "Something wents wrong !" });
        }
      });
  } catch (e) {
    return res.json({ success: 0, msg: "Something wents wrong !" });
  }
});

router.post("/updateKyc", common.tokenMiddleware, (req, res) => {
  let info = req.body;
  var encuId = encdec.decryptNew(req.body.userId);
  let setStatus = {};
  if (info.type == "id_proof") {
    setStatus = { id_status: 3, id_reject: "" };
  } else if (info.type == "passport_proof") {
    setStatus = { passport_status: 3, passport__reject: "" };
  } else if (info.type == "residence_proof") {
    setStatus = { residence_status: 3, residence_reject: "" };
  } else if (info.type == "selfie_proof") {
    setStatus = { selfie_status: 3, selfie_reject: "" };
  }
  users
    .updateOne(
      { _id: mongoose.mongo.ObjectId(encuId) },
      { $set: setStatus },
      { multi: true }
    )
    .exec(function (err, resUpdate) {
      if (resUpdate.nModified == 1) {
        users
          .findOne({ _id: mongoose.mongo.ObjectId(encuId) })
          .select({
            kyc_status: 1,
            id_status: 1,
            passport_status: 1,
            residence_status: 1,
            selfie_status: 1,
            profile_status: 1,
            id_proof: 1,
            id_proof1: 1,
            passport_proof: 1,
            selfie_proof: 1,
            residence_proof: 1,
          })
          .exec(function (userErr, userRes) {
            var kycInfo = {
              kyc_status: userRes.kyc_status,
              id_status: userRes.id_status,
              passport_status: userRes.passport_status,
              residence_status: userRes.residence_status,
              selfie_status: userRes.selfie_status,
              profile_status: userRes.profile_status,
              id_proof: userRes.id_proof,
              id_proof1: userRes.id_proof1,
              passport_proof: userRes.passport_proof,
              selfie_proof: userRes.selfie_proof,
              residence_proof: userRes.residence_proof,
            };
            if (
              (userRes.id_status == 3 &&
                userRes.residence_status == 3 &&
                userRes.selfie_status == 3) ||
              (userRes.passport_status == 3 &&
                userRes.residence_status == 3 &&
                userRes.selfie_status == 3)
            ) {
              users
                .findByIdAndUpdate(
                  { _id: mongoose.mongo.ObjectId(encuId) },
                  { $set: { kyc_status: 3, updated_at: updatedDate() } },
                  { multi: true }
                )
                .exec(function (kycErr, kycRes) {
                  if (kycRes) {
                    kycInfo.kyc_status = 3;
                    res.json({
                      success: 1,
                      msg: "Approved KYC status successfully",
                      kycInfo: kycInfo,
                    });
                  }
                });
            } else {
              res.json({
                success: 1,
                msg: "Approved successfully",
                kycInfo: kycInfo,
              });
            }
          });
      } else {
        res.json({ success: 0, msg: "somthing wents wrong !" });
      }
    });
});

router.post("/rejectKYC", common.tokenMiddleware, (req, res) => {
  let info = req.body;
  var encuId = encdec.decryptNew(req.body.userId);
  let setStatus = {};
  if (info.type == "id_proof") {
    setStatus = {
      id_status: 2,
      id_reject: info.Reason,
      id_proof: "",
      id_proof1: "",
    };
  } else if (info.type == "passport_proof") {
    setStatus = {
      passport_status: 2,
      passport__reject: info.Reason,
      passport_proof: "",
    };
  } else if (info.type == "residence_proof") {
    setStatus = {
      residence_status: 2,
      residence_reject: info.Reason,
      residence_proof: "",
    };
  } else if (info.type == "selfie_proof") {
    setStatus = {
      selfie_status: 2,
      selfie_reject: info.Reason,
      selfie_proof: "",
    };
  }
  users
    .updateOne(
      { _id: mongoose.mongo.ObjectId(encuId) },
      { $set: setStatus },
      { multi: true }
    )
    .exec(function (err, resUpdate) {
      if (resUpdate.nModified == 1) {
        users
          .findOne({ _id: mongoose.mongo.ObjectId(encuId) })
          .select({
            kyc_status: 1,
            id_status: 1,
            passport_status: 1,
            residence_status: 1,
            selfie_status: 1,
            profile_status: 1,
            id_proof: 1,
            id_proof1: 1,
            passport_proof: 1,
            selfie_proof: 1,
            residence_proof: 1,
          })
          .exec(function (userErr, userRes) {
            var kycInfo = {
              kyc_status: userRes.kyc_status,
              id_status: userRes.id_status,
              passport_status: userRes.passport_status,
              residence_status: userRes.residence_status,
              selfie_status: userRes.selfie_status,
              profile_status: userRes.profile_status,
              id_proof: userRes.id_proof,
              id_proof1: userRes.id_proof1,
              passport_proof: userRes.passport_proof,
              selfie_proof: userRes.selfie_proof,
              residence_proof: userRes.residence_proof,
            };
            res.json({
              success: 1,
              msg: "Successfully updated",
              kycInfo: kycInfo,
            });
          });
      } else {
        res.json({ success: 0, msg: "Invalid request. Please try again" });
      }
    });
});

router.post("/profitdata", common.originMiddle, function (req, res, next) {
  var info = req.body;
  wallet
    .findOne({ type: "Admin" }, { _id: 0, wallet: 1 })
    .exec(function (err, Profitdata) {
      if (Profitdata) {
        res.json({ success: 1, Profitdata: Profitdata.wallet });
      } else {
        res.json({ success: 0, msg: "somthing wents wrong!" });
      }
    });
});

router.get("/profitlist", common.originMiddle, function (req, res, next) {
  async.parallel(
    {
      currData: function (cb) {
        currency.find({}, { _id: 0, currency: 1 }).exec(cb);
      },
      gameData: function (cb) {
        gamelist.find({}, { _id: 0, game_name: 1 }).exec(cb);
      },
    },
    function (err, results) {
      if (err) return res.status(500).send(err);
      var currArray = results.currData.map(function (obj) {
        return obj.currency;
      });
      var gameArray = results.gameData.map(function (obj) {
        return obj.game_name;
      });
      var DayArray = ["Last24 Hours", "Last7 Days", "Last30 Days"];
      res.json({ success: 1, curr: currArray, game: gameArray, day: DayArray });
    }
  );
});

router.post(
  "/profitDataDetails",
  common.originMiddle,
  function (req, res, next) {
    var info = req.body;
    if (
      info.curr !== undefined &&
      info.game !== undefined &&
      info.day !== undefined
    ) {
      var d = new Date();
      if (info.day == "Last24 Hours") {
        d.setDate(d.getDate() - 1);
        var inittime = d;
      }
      if (info.day == "Last7 Days") {
        d.setDate(d.getDate() - 7);
        var inittime = d;
      }
      if (info.day == "Last30 Days") {
        d.setDate(d.getDate() - 30);
        var inittime = d;
      }
      if (info.game == "limbo" || info.game == "dice") {
        betHistory
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "coinflip") {
        coinBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "keno") {
        kenoBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "mines") {
        minesBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "rouvarte") {
        rouvarteBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "wheel") {
        wheelBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "fortune") {
        fortuneBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "sword") {
        swordBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "caveofplunder") {
        caveBetHis
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "bustabit") {
        crash
          .aggregate([
            {
              $match: {
                "users.currency": info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            { $unwind: { path: "$users" } },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$users.win_lose_amt" },
                TotalBet: { $sum: "$users.bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
      if (info.game == "plinko") {
        plinko
          .aggregate([
            {
              $match: {
                game: info.game,
                status: "loser",
                currency: info.curr,
                created_at: { $gte: new Date(inittime), $lte: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                Profit: { $sum: "$win_lose_amt" },
                TotalBet: { $sum: "$bet_amount" },
                Count: { $sum: 1 },
              },
            },
          ])
          .exec(function (err, resData) {
            if (resData.length !== 0) {
              var obj = {
                Profit: resData[0].Profit,
                userBet: resData[0].TotalBet,
                usercunt: resData[0].Count,
              };
            } else {
              var obj = { Profit: 0, userBet: 0, usercunt: 0 };
            }
            res.json({ success: 1, shearchData: obj });
          });
      }
    } else {
      res.json({ success: 0, msg: "Please Enter Valid Details !" });
    }
  }
);

/*walletCount:function(cb) {
			wallet.aggregate([{'$match': {'type': 'Admin'}}, 
			  {'$group': {'_id': 'null', 'total': {'$sum': {'$size': '$wallet'}}}}
			]).exec(cb)
		},
		walletData:function(cb) {
			// wallet.find({type: 'Admin'},{_id:0,wallet: {$slice: [ 1, 3]}}).exec(cb)
			wallet.find({type: 'Admin'},{_id:0,wallet: 1}).exec(cb)
		},*/

router.post("/ManageGame", common.userVerify, function (req, res, next) {
  var info = req.body;
  gamelist
    .findOne(
      { game_name: info.game },
      { Curr: { $elemMatch: { currency: info.curr } }, status: 1, _id: 0 }
    )
    .exec(function (err, resData) {
      if (resData) {
        if (resData.Curr.length > 0) {
          gamelist
            .updateOne(
              { "Curr.currency": info.curr },
              {
                $set: {
                  "Curr.$.min_bet": +parseFloat(info.min_bet),
                  "Curr.$.max_bet": +parseFloat(info.max_bet),
                  status: info.status,
                },
              },
              { multi: true }
            )
            .exec(function (balErr, balRes) {
              if (balRes) {
                res.json({ success: 1, msg: "successfully updated !" });
              } else {
                res.json({ success: 0, msg: "somthings wents wrong !" });
              }
            });
        } else {
          res.json({ success: 0, msg: "currency is undefined !" });
        }
      } else {
        res.json({ success: 0, msg: "somthings wents wrong !" });
      }
    });
});

router.post("/vipList", common.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? 1 : -1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");

  async.parallel(
    {
      vipCount: function (cb) {
        vip.find({}).countDocuments().exec(cb);
      },
      vipData: function (cb) {
        vip.find({}, {}, query).sort({ date: -1 }).exec(cb);
      },
    },
    function (err, resp) {
      if (err) {
        return res.json({ status: false });
      }
      res.json({
        status: true,
        data: resp.vipData,
        userCount: resp.vipCount - 1,
      });
    }
  );
});

router.post("/notifyList", common.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? 1 : -1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");

  async.parallel(
    {
      NotifyCount: function (cb) {
        notify.find({}).countDocuments().exec(cb);
      },
      NotifyData: function (cb) {
        notify.find({}, {}, query).sort({ date: -1 }).exec(cb);
      },
    },
    function (err, resp) {
      if (err) {
        return res.json({ status: false });
      }
      res.json({
        status: true,
        data: resp.NotifyData,
        userCount: resp.NotifyCount - 1,
      });
    }
  );
});

router.post("/getnotifyInfo", common.originMiddle, function (req, res, next) {
  var info = req.body;
  notify
    .findOne({ _id: mongoose.mongo.ObjectId(info.nofityId) })
    .exec(function (error, resData) {
      if (error) {
        res.json({ success: 0, msg: "notification is undefined !" });
      }
      if (resData) {
        res.json({ success: 1, data: resData });
      }
    });
});

router.post("/ManageNotify", common.tokenMiddleware, (req, res) => {
  var id = req.body.Id;
  var info = req.body;
  info.updated_at = updatedDate();
  notify
    .findOne({ _id: mongoose.mongo.ObjectId(id) })
    .exec(function (err, resData) {
      if (resData) {
        notify
          .updateOne({ _id: mongoose.mongo.ObjectId(id) }, { $set: info })
          .exec(function (uperr, upresData) {
            if (upresData) {
              res.json({
                success: 1,
                msg: "successfully updated notification",
              });
            } else {
              res.json({ success: 0, msg: "somthings wents wrong !" });
            }
          });
      } else {
        res.json({ success: 0, msg: "Notification is not defined !" });
      }
    });
});

router.post("/addNotify", common.tokenMiddleware, (req, res) => {
  var info = req.body;
  if (info.status == undefined) {
    return res.json({ success: 0, msg: "Please select Valid status" });
  }
  if (info.category == undefined || info.category == "") {
    return res.json({ success: 0, msg: "Please Enter Valid Category" });
  }
  if (info.message == undefined || info.message == "") {
    return res.json({ success: 0, msg: "Please Enter Valid Message" });
  }

  notify.create(info, function (err, result) {
    if (result) {
      res.json({ success: 1, msg: "successfully added notification !" });
    } else {
      res.json({ success: 0, msg: "Somthings wents wrong!" });
    }
  });
});

router.post("/getVipInfo", common.tokenMiddleware, (req, res) => {
  var info = req.body;
  vip
    .findOne({ _id: mongoose.mongo.ObjectId(info.id) })
    .exec(function (err, resData) {
      if (resData) {
        res.json({ success: 1, data: resData });
      } else {
        res.json({ success: 0, msg: "Somthings wents wrong!" });
      }
    });
});

router.post("/ManageVip", common.tokenMiddleware, (req, res) => {
  var info = req.body;
  vip
    .findOne({ _id: mongoose.mongo.ObjectId(info.Id) })
    .exec(function (err, resData) {
      if (resData) {
        vip
          .updateOne({ _id: mongoose.mongo.ObjectId(info.Id) }, { $set: info })
          .exec(function (uperr, upres) {
            if (upres) {
              res.json({ success: 1, data: resData });
            } else {
              res.json({ success: 0, msg: "VIP data is not defined !" });
            }
          });
      } else {
        res.json({ success: 0, msg: "Somthings wents wrong!" });
      }
    });
});

router.post("/blogList", common.originMiddle, function (req, res, next) {
  var info = req.body;
  var filter = info.filter || "";
  var pageNo = parseInt(info.pageIndex) || 0;
  var sortOrder = info.sortOrder;
  var size = parseInt(info.pageSize);
  var sortName = info.sortActive;
  var srt = {};
  srt[sortName] = sortOrder == "desc" ? 1 : -1;
  var query = {};
  query.sort = srt;
  query.skip = size * pageNo;
  query.limit = size;
  var regex = new RegExp(filter, "i");

  async.parallel(
    {
      BlogCount: function (cb) {
        blog.find({}).countDocuments().exec(cb);
      },
      BlogData: function (cb) {
        blog.find({}, {}, query).sort({ date: -1 }).exec(cb);
      },
    },
    function (err, resp) {
      if (err) {
        return res.json({ status: false });
      }
      res.json({
        status: true,
        data: resp.BlogData,
        userCount: resp.BlogCount - 1,
      });
    }
  );
});

router.post("/getBlogInfo", common.originMiddle, function (req, res, next) {
  var info = req.body;
  blog
    .findOne({ _id: mongoose.mongo.ObjectId(info.blogId) })
    .exec(function (error, resData) {
      if (error) {
        res.json({ success: 0, msg: "blog is undefined !" });
      }
      if (resData) {
        res.json({ success: 1, data: resData });
      }
    });
});

router.post(
  "/updateblog",
  upload.single("blog_pic"),
  common.userVerify,
  (req, res) => {
    var info = req.body;
    blog
      .findOne({ _id: mongoose.mongo.ObjectId(info.Id) })
      .exec(function (err, resData) {
        if (resData) {
          uploadcheck(req, function (uploadImg) {
            let obj = {
              title: info.title,
              status: info.status,
              message: info.message,
              image: uploadImg,
              updated_at: updatedDate(),
            };
            blog
              .updateOne(
                { _id: mongoose.mongo.ObjectId(info.Id) },
                { $set: obj }
              )
              .exec(function (uperr, upres) {
                if (upres) {
                  res.json({ success: 1, msg: "Successfully Blog updated !" });
                } else {
                  res.json({ success: 0, msg: "Blog data is not defined !" });
                }
              });
          });
        } else {
          res.json({ success: 0, msg: "Somthings wents wrong!" });
        }
      });
  }
);

router.post(
  "/addBlog",
  upload.single("blog_pic"),
  common.userVerify,
  (req, res) => {
    var info = req.body;
    if (info.title == undefined || info.title == null || info.title == "") {
      return res.json({ success: 0, msg: "Please Enter valid Title !" });
    }
    if (info.status == undefined || info.status == null) {
      return res.json({ success: 0, msg: "Please Select valid status !" });
    }
    if (
      info.message == undefined ||
      info.message == null ||
      info.message == ""
    ) {
      return res.json({ success: 0, msg: "Please Enter valid message !" });
    }
    uploadcheck(req, function (uploadImg) {
      let obj = {
        title: info.title,
        status: info.status,
        message: info.message,
        image: uploadImg,
      };
      blog.create(obj, function (err, result) {
        if (result) {
          res.json({ success: 1, msg: "successfully added Blog !" });
        } else {
          res.json({ success: 0, msg: "Somthings wents wrong!" });
        }
      });
    });
  }
);

function uploadcheck(req, callback) {
  var uploadImg = "";
  if (req.file != null && req.file != undefined && req.file.path != "") {
    cloudinary.uploadImage(req.file.path, function (imgRes) {
      if (imgRes != undefined) {
        uploadImg = imgRes.secure_url;
        callback(uploadImg);
      } else {
        callback(uploadImg);
      }
    });
  } else {
    callback(req.body.image);
  }
}

router.post("/email-templates", async (req, res) => {
  try {
    const { title, mailsubject, mailcontent } = req.body;

    if (!title || !mailsubject || !mailcontent) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedTemplate = await emailtemplate.findOneAndUpdate(
      { title }, // search by title
      {
        mailsubject,
        mailcontent,
        updated_at: Date.now(),
      },
      {
        new: true, // return the modified document
        upsert: true, // create if it doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    const isNew =
      updatedTemplate.created_at.getTime() ===
      updatedTemplate.updated_at.getTime();

    return res.status(isNew ? 201 : 200).json({
      message: isNew
        ? "Email template created successfully."
        : "Email template updated successfully.",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error creating/updating email template:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
