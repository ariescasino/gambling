let express = require('express');
var async  = require('async');
let multer  = require('multer');
let router = express.Router();
let cloudinary = require('../../helpers/cloudinary');
var endecrypt = require('../../helpers/newendecryption');

let mongoose = require('mongoose');
let cms = require('../../model/cms');

let helpingLib = require('../../helpers/common');

//upload  storage
let storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});
let upload = multer({ storage: storage });

let response = {};

let updatedDate = ()=>{
	return new Date();
};

// get cms data
router.post('/get_cms', (req,res) => {
	var info = req.body;	
	var filter = info.filter || '';
	var pageNo = parseInt(info.pageIndex) || 0;
	var sortOrder = info.sortOrder;
	var size = parseInt(info.pageSize);
	var sortName = info.sortActive;
	var search   = {}
	var srt   = {}
	srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
	var query = {};
	query.sort = srt;
	query.skip = size * pageNo;
	query.limit = size;
	async.parallel({
		cmsCount:function(cb) {
			cms.find(search).countDocuments().exec(cb)
		},
		cmsData:function(cb) {
			cms.find(search, {}, query).exec(cb)
		},
	},function(err,results){
		if (err) return res.status(500).send(err);
		response.status    = true;
		response.data      = results.cmsData;
		response.cmsCount = results.cmsCount;
		res.json(response);
	})
});

router.post('/post_cms', (req,res) => {
	cms.find({"pagetype":req.body.pagehint},{_id:0}).select("pagecontent pagetitle").exec(function(error,resData){
		if (error) {
			return next(error);
		}
		if(resData){
			res.json({status : true, data : resData });
		}
	})
});

router.post('/getcmsInfo', (req,res) => {
	var info = req.body;
	var id = info.cmsId;
	cms.findOne({"_id": id}).exec(function(error,resData){
		if (error) {
			return next(error);
		}
		if(resData){
			res.json({status : true, data : resData });
		}
	})
});

router.post('/cmsUpdate',helpingLib.tokenMiddleware, (req,res) => {
	let info = req.body;
	let obj = {
		"pagetitle" : info.pagetitle,
		"pagecontent" : info.pagecontent,
		"updated_at" : updatedDate()
	};
	cms.updateOne({ "_id": mongoose.mongo.ObjectId(info.cmsId)},{ "$set": obj },{multi: true}).exec(function(err, resUpdate){
		if(resUpdate) {
			response = {status : true, msg : "Successfully updated", data: info};
		} else {
			response = {status : false, msg : "Invalid request. Please try again"};
		}
		res.json(response);	
	});
});


function uploadcheck(req,callback) {
	var uploadImg = "";
	if(typeof req.file != 'undefined' && typeof req.file != undefined && req.file.path != "") {
		cloudinary.uploadImage(req.file.path,function(imgRes){
			if(imgRes != undefined) {
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

module.exports = router;