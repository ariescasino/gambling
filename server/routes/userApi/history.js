const express  = require('express');
const router   = express.Router();
const fs = require('fs');
const toFixed = require('tofixed');
const multer  = require('multer');
const mongoose = require('mongoose');
const validator = require('validator');
const async  = require('async');
const moment = require('moment');
var CryptoJS = require('crypto-js');

const common = require('../../helpers/common');
const cloudinary = require('../../helpers/cloudinary');
const encdec = require('../../helpers/newendecryption');
const helpingLib = require('../../helpers/common');


const betHistory = require('../../model/bet_history');
const coinhistory = require('../../model/coinflip_bethis');
const users = require('../../model/users');
const wheelhistory = require('../../model/wheel_result');
const fortune = require('../../model/wheeloffortune');
const cave = require('../../model/cave_bethistory');
const keno = require('../../model/keno_bet_history');
const roulette = require('../../model/roulette_bethistory');
const mines = require('../../model/mines_bethistory');
const gamelist = require('../../model/gamelist');
const sword = require('../../model/sword_bethistory');
const plinko = require('../../model/plinko_bethistory');
const crash =  require('../../model/crash_bethistory');
const currency =  require('../../model/currency');


// const betHistory = require('../model/coinflip_bethis');

router.get('/historyDashboard', common.tokenMiddleware, (req, res) => {
	async.parallel({
		limboCount:function(cb) {
			betHistory.find({ game: "limbo" }).countDocuments().exec(cb)
		},
		diceCount:function(cb) {
			betHistory.find({game:"dice"}).countDocuments().exec(cb)
		},
		coinflipCount:function(cb) {
			coinhistory.find({game:"coinflip"}).countDocuments().exec(cb)
		},
		wheelCount:function(cb) {
			wheelhistory.find({game:"wheel"}).countDocuments().exec(cb)
		},
		fortuneCount:function(cb) {
			fortune.find({game:"fortune"}).countDocuments().exec(cb)
		},
		plunderCount:function(cb) {
			cave.find({game:"caveofplunder"}).countDocuments().exec(cb)
		},
		kenoCount:function(cb) {
			keno.find({game:"keno"}).countDocuments().exec(cb)
		},
		rouletteCount:function(cb) {
			roulette.find({game:"roulette"}).countDocuments().exec(cb)
		},
		minesCount:function(cb) {
			mines.find({game:"mines"}).countDocuments().exec(cb)
		},
		swordCount:function(cb) {
			sword.find({game:"sword"}).countDocuments().exec(cb)
		},
		crash:function(cb) {
			crash.find({}).countDocuments().exec(cb)
		},
		plinko:function(cb) {
			plinko.find({}).countDocuments().exec(cb)
		}
	},function(err,results){
		if (err){ return res.status(500) };
		let data={};
		data.status=true;
		data.limbo=results.limboCount
		data.dice=results.diceCount
		data.flip=results.coinflipCount
		data.wheel=results.wheelCount
		data.fortune=results.fortuneCount
		data.plunder=results.plunderCount
		data.keno=results.kenoCount
		data.roulette=results.rouletteCount
		data.mine=results.minesCount
		data.sword=results.swordCount
		data.crash=results.crash
		data.plinko=results.plinko
		res.json(data);
	})
});


// limbo
router.post('/getLimbohistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			betHistory.find({game: "limbo"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			betHistory.find({game: "limbo"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			        storeData={gameid:values._id,user_id:values.user_id,game:values.game,bet_amount:values.bet_amount,currency:values.currency,payout:values.payout,bet_result:values.bet_result,status:values.status,win_lose_amt:values.win_lose_amt,client_seed:values.client_seed,server_seed:values.server_seed,nonce:values.nonce,created_at:values.created_at,username:rest.username}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


// dice
router.post('/getDicehistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			betHistory.find({game: "dice"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			betHistory.find({game: "dice"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			        storeData={gameid:values._id,user_id:values.user_id,game:values.game,bet_amount:values.bet_amount,currency:values.currency,payout:values.payout,bet_result:values.bet_result,status:values.status,win_lose_amt:values.win_lose_amt,client_seed:values.client_seed,server_seed:values.server_seed,nonce:values.nonce,created_at:values.created_at,username:rest.username,bet_type:values.bet_type,roll_value:values.roll_value}
			        	res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


// coinflip
router.post('/getfliphistory',helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");
	
	async.parallel({
		betCount:function(cb) {
			coinhistory.find({game:"coinflip"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			coinhistory.find({game:"coinflip"},{},query).sort({'date': -1 }).exec(cb)
		},
	},function(err,res1){
		if(err){ return res.json({status:false}) }
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			       	storeData={gameid:values._id,game:values.game,bet_amount:values.bet_amount,
			       		currency:values.currency,payout:values.payout,username:rest.username,
			       		win_lose_amt:values.win_lose_amt,status:values.status,
			       		created_at:values.created_at,}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
		// res.json({'success':1,'data':resp.usersData,'userCount':resp.usersCount-1})
	})
});


router.post('/flipDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	coinhistory.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,msg:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status}

            		res.json({success:1,msg:data})
            	}
            })
		}else{
			return res.json({success:0,msg:"Somthings wents wrong !"});	
		}
	})
})

// wheel
router.post('/getwheelhistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");


	async.parallel({
		betCount:function(cb) {
			wheelhistory.find({game: "wheel"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			wheelhistory.find({game: "wheel"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			        storeData={
					    gameid:values._id,user_id:values.user_id,game:values.game,bet_amount:
					    values.bet_amount,currency:values.currency,payout:values.payout,
					    win_lose_amt:values.win_lose_amt,risk:values.risk,segment:values.segment,
					    status:values.status,bet_result:values.result,client_seed:values.client_seed
					    ,server_seed:values.server_seed,nonce:values.nonce,created_at:
					    values.created_at,username:rest.username
					}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


//ring of fortune
router.post('/getfortunehistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			fortune.find({game: "fortune"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			fortune.find({game: "fortune"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			        storeData={ game:values.game,bet_amount:values.bet_amount,currency:values.currency,
    					payout:values.payout,win_lose_amt:values.win_lose_amt,status:values.status,bet_result:values.result,username:rest.username,created_at:values.created_at, gameid:values._id,}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


router.post('/fortuneDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	fortune.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,"risk":resp.risk,"segment":resp.segment,
            			"initial_bet":resp.initial_bet,"game_result":resp.game_result}

            		res.json({success:1,history:data})
            	}
            })
		}
	})
})


//cave of plunder
router.post('/getcavehistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			cave.find({game: "caveofplunder"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			cave.find({game: "caveofplunder"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			      storeData={bet_amount:values.bet_amount,currency:values.currency,
			       	payout:values.payout,win_lose_amt:values.win_lose_amt,status:values.status,
					bet_result:values.bet_result,currency:values.currency,username:rest.username,
					created_at:values.created_at,gameid:values._id}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


router.post('/caveDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	cave.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
		    const clientSeed  = resp.client_seed;
		    const nounce= parseInt(resp.nonce);

		    var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
		    let val=hmacWA.toString();

		    var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
		    var fss=hmacDirectWA.toString();

		    users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
		      	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
		      	}
		      	if(Resp){
		      		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status}

		      		res.json({success:1,history:data})
		      	}
		    })
		}
	})
})

//keno
router.post('/getkenohistory', helpingLib.originMiddle, function(req, res,next){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			keno.find({game: "keno"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			keno.find({game: "keno"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			     storeData={bet_amount:values.bet_amount,currency:values.currency,
			       	payout:values.payout,win_lose_amt:values.win_lose_amt,status:values.status,
					bet_result:values.bet_result,currency:values.currency,username:rest.username,
					created_at:values.created_at,gameid:values._id}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount-1 });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


router.post('/kenoDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	keno.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,userbet:resp.bet_user,win:resp.bet_matched,loss:resp.bet_notmatch}
            		res.json({success:1,history:data})
            	}
            })
		}
	})
})


//roulette
router.post('/getroulettehistory', helpingLib.originMiddle, function(req, res, next) {
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
	var regex = new RegExp(filter, "i");
	var search = {};
	var start = "";
	if(info.startDate != '') {
		if(moment(new Date(info.startDate), "YYYY-MM-DD h:mm:ss").isValid()) {
			var startDate = new Date(info.startDate);
			startDate.setDate(startDate.getDate() + 1 );
			start = startDate.toISOString();
		}
	}
	var end = "";
	if(info.endDate != '') {
		if(moment(new Date(info.endDate), "YYYY-MM-DD h:mm:ss").isValid()) {
			var endDate = new Date(info.endDate);
			endDate.setDate(endDate.getDate() + 1 );
			end = endDate.toISOString();
		}
	}
	search = {game:"roulette"};
	if(start != '' && end != '') {
		search['$or'] = [{'created_at': { $gte:  new Date(start), $lt:  new Date(end)}}];
	}
	async.parallel({
		userCount:function(cb) {
			roulette.find(search).countDocuments().exec(cb)
		},
		userData:function(cb) {
			roulette.find(search, {}, query).sort({'created_at': -1 }).exec(cb)
		},
	},function(err,results){
		if (err) return res.status(500).send(err);
		GetUserName(results.userData,function(data1){
			res.json({ success: 1, data: data1, userCount : (results.userCount-1) });
		});
	})
});

function GetUserName(resVal, callback){
	var i = 1;var length = resVal.length;var storeData=[];
	if(length > 0) {
	    resVal.forEach((values, index) => {
		    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
		       	storeData={username:rest.username,bet_amount:values.bet_amount,
		       		currency:values.currency,payout:values.payout,
		       		win_lose_amt:values.win_lose_amt,status:values.status,created_at:values.created_at,gameid:values._id}
		        resVal[index]=storeData;
		        if (i == length) {
		        	callback(resVal)
		        }
		        i = i + 1;
		    });
		});
	}else{
		callback([]);
	}
}


router.post('/rouletteDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	roulette.findOne({'_id':_id,}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,userbet:resp.userBet,bet_result:resp.bet_result}
            		res.json({success:1,history:data})
            	}
            })
		}
	})
})


//mines
router.post('/getminehistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			mines.find({game: "mines"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			mines.find({game: "mines"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			    storeData={username:rest.username,bet_amount:values.bet_amount,currency:values.currency,payout:values.payout,win_lose_amt:values.win_lose_amt,noMines:values.
			    	no_of_mines,status:values.status,created_at:values.created_at,gameid:values._id}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})

});


router.post('/mineDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	mines.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,"mines":resp.no_of_mines}

            		res.json({success:1,history:data})
            	}
            })
		}
	})
})

router.post('/getswordhistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			sword.find({game: "sword"}).countDocuments().exec(cb)
		},
		history:function(cb) {
			sword.find({game: "sword"},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			    storeData={username:rest.username,bet_amount:values.bet_amount,currency:values.currency,payout:values.payout,win_lose_amt:values.win_lose_amt,status:values.status,created_at:values.created_at,gameid:values._id}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});

router.post('/swordDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	sword.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status, currency:resp.currency,spin_result: resp.spin_result, result: resp.game_result, cat_result: resp.catspin_result}
            		res.json({success:1,history:data})
            	}
            })
		}else{
			res.json({success:0,msg:"Something wents wrong !"});
		}
	})
})

router.post('/gameList', helpingLib.originMiddle, function(req, res, next) {
	var info = req.body;
	var filter = info.filter || '';
	var pageNo = parseInt(info.pageIndex) || 0;
	var sortOrder = info.sortOrder;
	var size = parseInt(info.pageSize);
	var sortName = info.sortActive;
	var srt   = {}
	srt[sortName] = (sortOrder == 'desc') ? 1 : -1;
	var query = {};
	query.sort = srt;
	query.skip = size * pageNo;
	query.limit = size;
	var regex = new RegExp(filter, "i");
	
	async.parallel({
		usersCount:function(cb) {
			gamelist.find({}).countDocuments().exec(cb)
		},
		usersData:function(cb) {
			gamelist.find({},{},query).sort({'date': -1 }).exec(cb)
		},
	},function(err,resp){
		if(err){ return res.json({status:false}) }
		res.json({'status':true,'data':resp.usersData,'userCount':resp.usersCount-1})
	})
})


router.post('/editGamelist',common.userVerify, function (req, res) {
	var id=req.body.id;var Verstatus=req.body.status;

	var status=(Verstatus=="activate") ? 0 : 1; 

	gamelist.findOne({_id:id}).exec(function(err,resp){
		if(resp){
			gamelist.updateOne({_id:id},{$set:{status:status,updated_at:new Date()}}).exec(function(upErr,upRes) {
				if(upErr){ return res.json({status:false,msg:"Invalid Request"}) };
				if(upRes){ return res.json({status:true,msg:"Updated Successfully"}) };
			})
		}else{
			return res.json({status:false,msg:"Please try again"})
		}
	})
})


router.post('/getcrashhistory', helpingLib.originMiddle, function(req, res){
	var info = req.body;
	var filter = info.filter || '';
	var pageNo = parseInt(info.pageIndex) || 0;
	var sortOrder = info.sortOrder;
	var size = parseInt(info.pageSize);
	var sortName = info.sortActive;
	var srt   = {}
	srt[sortName] = (sortOrder == 'desc') ? -1 : 1;
	var sort  = srt;
	var skip  = size * pageNo;
	var limit = size;


	async.parallel({
		betCount:function(cb) {
			crash.find({}).countDocuments().exec(cb)
		},
		history:function(cb) {
			crash.aggregate([{
				'$project': { 
					'totalbetamt': {'$sum': '$users.bet_amount'}, 
      				'participants': {'$size': '$users' }, 
      				'betresult': '$bet_result', 
      				'created_at': '$created_at', 
      				'status': '$status'}
				},
  				{ "$sort": sort },
				{ "$skip": skip },
				{ "$limit": limit }
			]).exec(cb)
			// crash.find({},{},).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
	        res.json({ success: 1, data: res1.history,userCount:res1.betCount });
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});


router.post('/crashDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	crash.findOne({'_id':_id}).exec(function(err,resp){
		if(err){ return res.json({success:0,history:"Invalid Request"});}
		if(resp){ res.json({success:1,history:resp}) }
	})
})

router.post('/getplinkohistory', helpingLib.originMiddle, function(req, res){
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
	var regex = new RegExp(filter, "i");

	async.parallel({
		betCount:function(cb) {
			plinko.find({}).countDocuments().exec(cb)
		},
		history:function(cb) {
			plinko.find({},{},query).sort({ _id: -1 }).exec(cb)
		},
	},function(err1, res1){
		if (res1.history.length>0) {
			var i = 1;var length = res1.history.length;var storeData=[];
		    res1.history.forEach((values, index) => {
			    users.findOne({'_id':values.user_id},{username:1,_id: 0}).exec(function(err,rest) {
			    storeData={
			    	username:rest.username,
			    	bet_amount:values.bet_amount,
			    	currency:values.currency,
			    	payout:values.payout,
			    	win_lose_amt:values.win_lose_amt,
			    	status:values.status,created_at:values.created_at,
			    	gameid:values._id}
			        res1.history[index]=storeData;
			        if (i == length) {
			          res.json({ success: 1, data: res1.history,userCount:res1.betCount });
			        }
			        i = i + 1;
			    });
			});
		}else{
			res.json({success:0, data:"no data" })
		}
	})
});

router.post('/plinkoDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;var game=req.body.game;
	plinko.findOne({'_id':_id,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,history:"Invalid Request"});	
		}
		if(resp){

            users.findOne({'_id':resp.user_id},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,history:"Invalid Request"});	
            	}
            	if(Resp){
            		var data={
            			"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,'status':resp.status}

            		res.json({success:1,history:data})
            	}
            })
		}
	})
})

router.post('/getgameInfo', common.userVerify, function(req, res){
	let game = req.body.game;
	let curr = req.body.curr;
	gamelist.findOne({game_name:game}, {Curr:{$elemMatch:{currency:curr}}, status:1,_id:0}).exec(function(err,resData){
		if(resData){
	      	if(resData.Curr.length > 0){
	        	let min_bet = resData.Curr[0].min_bet;
	        	let max_bet = resData.Curr[0].max_bet;
	           	res.json({success:1,min_bet:min_bet, max_bet:max_bet, status:resData.status, curr:curr});
	      	} else {
	     		res.json({success:0, min_bet:0, max_bet:0});
	      	}
		}else{
			res.json({success:0, min_bet:0, max_bet:0});
		}
	});
})


router.get('/getCurr', common.userVerify, async function(req, res){
	currency.find({status:'1'},{ _id:0, currency:1,}).exec(function(err, currData){
		if(currData){
			var currArray = currData.map(function (obj) {return obj.currency;});
			return res.json({success:1, currency : currArray});
		}else{
			return res.json({success:0, msg : "currency not defined !"});
		}
	})
})

module.exports = router;

