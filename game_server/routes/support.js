const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const async  = require('async');
const moment = require('moment');
const validator = require('validator');
var CryptoJS = require('crypto-js');
const multer = require('multer');

//helpers
const encrypt = require('../helpers/encrypt');
const common = require('../helpers/common');
const mail = require('../helpers/mail');
const game = require('../helpers/game');
const cloudinary = require('../helpers/cloudinary');

//schemas
const users = require('../model/users');
const supportCat = require('../model/supportIssues');
const support=require('../model/support')

//other file
var storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, common.randomString(8) + new Date().getTime() + file.originalname);
	}
});
var upload = multer({ storage: storage });
var currentDate=new Date();

//get support categories
router.get('/supportCat', (req, res)=>{
	supportCat.find({},{category:1,_id:0}).exec(function(userErr, userData){
		if(userData){
			return res.json({ success:1, userData: userData});
		}else{
			return res.json({ success:0, msg:"Something wents wrong !" });
		}
	})
})


router.post('/upload',upload.single('image'), (req, res) => {
	var option=req.body.option;var message=req.body.message;
	var username=req.body.username;var email=req.body.email;
	var firstEmail = encrypt.encryptNew(common.firstNewMail(email));
	var secondEmail = encrypt.encryptNew(common.secondNewMail(email));
	var random = common.generateRandomNumber()+currentDate.getTime();let mess = []; 
	const imageFile = req.file;

	uploadKyc(imageFile, function(imgArray) {
		let obj = {};
		if(imgArray['ProofUrl'] != null && imgArray['ProofUrl'] != undefined) {
			obj["ProofUrl"] = imgArray['ProofUrl'];
		}else{
			obj["ProofUrl"] = imgArray[''];
		}

		var datas={"userName":username,"email":email,"SelectedOption":option,"Query":message,"ProofUrl":obj.ProofUrl,"MessageId":random}
		support.create(datas, function(err,resData) {
			if(resData){
				return res.json({"success":1, "msg":"Record has been recorded"});
			}
			if(err){
				return res.json({"success":0, msg:"Something went wrong"});
			}
		})
	})
});

function uploadKyc(req, callback) {
	if(req==undefined){
		return callback(imgArray)
	}
	var imgArray = [];
	cloudinary.uploadIeo(req.path, function(imgRes){
		if(imgRes != undefined) {
			var orgName = imgRes.original_filename;
			var proofName = "ProofUrl";
			var checkPrf = orgName.substr(orgName.length - 12);
			var checkPrf1 = orgName.substr(orgName.length - 9);
			if(checkPrf == 'ProofUrl'){
				var proofName = 'ProofUrl';
			} 
			imgArray[proofName]=imgRes.secure_url;
			callback(imgArray)
		}else{
			callback(imgArray)
		}	
	});
}

module.exports = router;
