const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const async  = require('async');

const moment = require('moment');
const validator = require('validator');

var CryptoJS = require('crypto-js');

//helpers
const encrypt = require('../helpers/encrypt');
const common = require('../helpers/common');
const mail = require('../helpers/mail');
const game = require('../helpers/game');

//schemas
const users = require('../model/users');
const logs = require('../model/user_history');
const currency = require('../model/currency');
const wallet = require('../model/userWallet');
const userHash = require('../model/user_hash');
const betHistory = require('../model/crash_bethistory');
const gamelist = require('../model/gamelist');
const profitDb = require('../model/profit');

var socket = 0;
var SocketInit = function (io) { socket = io; }

let intervalId = '';

router.post('/getBetInfo', common.userVerify, function(req, res){
	var userId 		  = req.userId;
	var bet_amount 	  = req.body.bet_amount;
	var currency  	  = req.body.currency;
	var betId 		  = req.body.betId;
	var auto_cashout  = req.body.auto_cashout;
	if(global.status == "waiting" && global.betId != "") {
		common.findUserBalance(userId, currency, async function(userBalance){ 
			if(bet_amount <= userBalance) {
				var username = await common.getUsername(userId);
				var updated_balance = userBalance - bet_amount;
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
				var obj = {user_id:mongoose.mongo.ObjectId(userId),bet_amount:bet_amount,currency:currency,auto_cashout:auto_cashout,payout:0,status:'pending',win_lose_amt:0, username: username};
				betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId)}, {"$push":{users:obj}}).exec(function(err1, resp1) {
					betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(function(err2, res2){
						if(err2) {
							socket.sockets.emit('receiveUserInfo', {'userList' : res2.users, 'status' : 0});
							res.json({success:0,msg:"No user joined"});
						}
						if(res2) {
							global.betUsers = res2.users;
							socket.sockets.emit('receiveUserInfo', {'userList' : res2.users, 'status' : 1});
							res.json({success:1});
						}
					})
				});
			} else {
				return res.json({success:0,msg:"Insufficient Balance"});
			}
		});
	} else {
		return res.json({success:0,msg:"Bet Id Expired"});
	}
});


router.post('/updateBetInfo', common.userVerify, function(req, res){
	var userId   = req.userId;
	var pay_out  = req.body.pay_out; 
	var bet_id   = req.body.bet_id;
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	//if(global.status == "on" && bet_id == global.betId) {
	betHistory.findOne({_id:mongoose.mongo.ObjectId(bet_id), "users.user_id":mongoose.mongo.ObjectId(userId), "users.status":"pending"}).exec(function(err1, res1){

		if(res1) {
			const userData = res1.users.find(user => user.user_id == userId);
			if(userData.status == "pending") {
				common.findUserBalance(userId, currency, async function(userBalance){ 
					var win_lose_amt = pay_out * bet_amount
					win_lose_amt = parseFloat(win_lose_amt) - parseFloat(bet_amount)
					var updated_balance = userBalance + win_lose_amt;
					// console.log(updated_balance);
					var balance = await common.updateUserBalance(userId, currency, updated_balance);
					
					

					betHistory.updateOne({_id:mongoose.mongo.ObjectId(bet_id), "users.user_id":mongoose.mongo.ObjectId(userId)},{"$set":{"users.$.payout":pay_out, "users.$.status":"winner", "users.$.win_lose_amt":win_lose_amt}}, {multi:true}).exec(function(balErr,balRes){
						betHistory.findOne({_id:mongoose.mongo.ObjectId(bet_id)}).exec(function(err2, res2){

							socket.sockets.emit('receiveUserInfo', {'userList' : res2.users, 'status' : 1});

						    if(balRes){
						    	return res.json({success:1, balance:updated_balance});
						    } else {
						      	return res.json({success:0, msg:"Please try again..!"});
						    }
						});
					});
				});
			} else {
				return res.json({success:0, msg:"Session expired"});
			}
		} else {
			return res.json({success:0, msg:"Session expired"});
		}
	})
})

router.get('/getGlobal', function(req, res) {
	return res.json({success:1, globalVar:global.myGlobalVariable, status:global.status, gameresult_status:global.gameresult_status, result:global.result});
});

router.get('/setGlobal', async (req, res) => {
	await initCrash();
	res.json({success:1, msg:global.myGlobalVariable});
});

async function initCrash() {
	// console.log('Initiated');
	//await getCrashResult();
	global.myGlobalVariable = 0.00;
	global.status = "on";
	intervalId = setInterval(async () => {
		await increase(global.result);
	}, 100);
}

/*async function getCrashResult() {
	if(global.gameresult_status == "1") {
		var client_seed = common.randomString(16);
		var server_seed = common.randomString(16);
		client_seed = encrypt.withEncrypt(client_seed);
    	server_seed = encrypt.withEncrypt(server_seed);
		var nonce = common.generateRandomNumber();

		global.result = game.limboGameResult(client_seed,server_seed,nonce);
		let obj = { bet_result:global.result, status:"completed", client_seed:client_seed,server_seed:server_seed, nonce:nonce };

		betHistory.create(obj, function(err, resData){
			global.betId = resData._id;
			global.oldBetId = resData._id;
		})
		global.gameresult_status = "0";
	} 
}*/

function random(min, max) {
    const random = Math.random();
    min = Math.round(min);
    max = Math.floor(max);
    return random * (max - min) + min;
}

async function getCrashResult() {
	if(global.gameresult_status == "1") {
		var client_seed = common.randomString(16);
		var server_seed = common.randomString(16);
		client_seed = encrypt.withEncrypt(client_seed);
    	server_seed = encrypt.withEncrypt(server_seed);
		var nonce = common.generateRandomNumber();

		global.result = game.limboGameResult(client_seed,server_seed,nonce);
		if(global.result > 10) {
			var rand = random(10,11);
			global.result = rand.toFixed(2);
		}
 
		//global.result = 5;
		//global.result = 100; 
		let obj = { bet_result:global.result, status:"completed", client_seed:client_seed,server_seed:server_seed, nonce:nonce };

		betHistory.create(obj, function(err, resData){
			global.oldBetId = resData._id;
			global.betId = resData._id;
		})
		// console.log(global.result);
		global.gameresult_status = "0";
	} 
}

async function increase(result) {
	if(global.myGlobalVariable >= result) {
		global.gameresult_status = "1";
		global.myGlobalVariable = result;
		global.status = "off";
		clearInterval(intervalId);
		//await sleep(3000); 
		/*setTimeout(() => {
			global.waitingtime = "on";
		}, 5000);*/
		global.old_betId = global.oldBetId;
		await getCrashResult();
		await timeoutEmit(6000);
		/*setTimeout(async () => {
			await 
		}, 6000);*/
	} else {
		global.betId = "";
		global.myGlobalVariable = global.myGlobalVariable + 0.01;
		socket.sockets.emit('receiveCrash', {'globalVar' : global.myGlobalVariable, 'status' : global.status, 'gameresult_status' : global.gameresult_status});
	}
}

async function timeoutEmit(time){
	updateUsers();

	time = time / 1000;
	//global.myGlobalVariable = time.toFixed(2);
	for(var t = time; t >= 0; t--) {
		if(t > 6) {
			global.status = "busted";
			socket.sockets.emit('receiveCrash', {'globalVar' : global.myGlobalVariable, 'status' : global.status, 'gameresult_status' : global.gameresult_status, 'betId':global.betId,'oldBetId':global.old_betId});
		}

		if(t <= 6) {
			global.myGlobalVariable = t;
			global.status = "waiting";
			socket.sockets.emit('receiveCrash', {'globalVar' : global.myGlobalVariable, 'status' : global.status, 'gameresult_status' : global.gameresult_status, 'betId':global.betId});
			if(t == 0) { await initCrash(); }
		}

		await sleep(1000);
	}
}

async function updateUsers() {
	let users  = global.betUsers;
	global.betUsers = []; 
	let result = global.result;
	var betId  = global.old_betId;
	var userInfo = [];
	if(betId !== undefined){
		betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(function(err2, res2){
			if(res2) {
				var users = res2.users;
				if(users == undefined){users = []}
				users.forEach((val) => {
					if(val.status == "pending") {
						if(val.auto_cashout <= result) {
							common.findUserBalance(val.user_id, val.currency, async function(userBalance){
								var win_lose_amt = val.bet_amount * val.auto_cashout;
								var updated_balance = userBalance + win_lose_amt;
								// console.log(updated_balance);
								var balance = await common.updateUserBalance(val.user_id, val.currency, updated_balance);

								var userData = {
									user_id 		: mongoose.mongo.ObjectId(val.user_id),
									username 		: val.username,
									bet_amount		: val.bet_amount,
									currency 		: val.currency,
									auto_cashout 	: val.auto_cashout,
									payout 			: val.auto_cashout,
									status 			: "winner",
									win_lose_amt 	: win_lose_amt - val.bet_amount
								}

								userInfo.push(userData);
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId)}, {"$set":{users:userInfo}}).exec();
							})
						} else { 
							//admin profit updation
							var userData = {
								user_id 		: mongoose.mongo.ObjectId(val.user_id),
								username 		: val.username,
								bet_amount		: val.bet_amount,
								currency 		: val.currency,
								auto_cashout 	: val.auto_cashout,
								payout 			: 0,
								status 			: "loser",
								win_lose_amt 	: val.bet_amount
							}

							userInfo.push(userData);
							betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId)}, {"$set":{users:userInfo}}).exec();
						}	
					} else {
						userInfo.push(val);
						betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId)}, {"$set":{users:userInfo}}).exec();
					}
				})
			}
		})
	}

	//await betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId)}, {"$set":{users:userInfo}}).exec();
}

function receiveInfo(data)
{
	//emit from cashout 
	console.log("AAAA");
	console.log(data);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({},{server_seed:1,_id:1,created_at:1,bet_result:1}).sort({_id : -1}).limit(100).exec(function(err1, res1){
        if(res1){
        		var data = res1.shift();
            return res.json({success:1,msg:res1});
        }else{
            return res.json({success:0,msg:"Somthing wents wrong !"});
        }
    })
});

router.post('/getDetails',common.userVerify, function (req, res) {
	var _id=req.body._id;
	betHistory.findOne({'_id':mongoose.mongo.ObjectId(_id)}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Somthing wents wrong ! "});	
		}
		if(resp){
			if(resp.users[0] !== undefined ){
				const serverSeed = resp.server_seed;
			    const clientSeed  = resp.client_seed;
			    var serverSeed1 = encrypt.withDecrypt(serverSeed);
			  	var clientSeed2 = encrypt.withDecrypt(clientSeed);
			    const nounce= parseInt(resp.nonce);
			    var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
			    let val=hmacWA.toString();
			    var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
			    var fss=hmacDirectWA.toString();
			  	users.findOne({'_id':mongoose.mongo.ObjectId(resp.users[0].user_id)},{username:1,_id:0}).exec(function(Errs,Resp) {
			      	if(Errs){
						return res.json({success:0,msg:"Something wents wrong !"});	
			      	}
			      	if(Resp){
					  	var data={"bet_id":resp._id,"username":Resp.username, "created_at":resp.created_at,"bet_result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,'betList':resp.users,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}
					  	res.json({success:1,msg:data});
			      	} else {
					  	res.json({success:0,msg:"somthings wents wrong"});
			      	}
			    })
			} else {
	  			res.json({success:1,data:[]})
			}
		} else {
  			res.json({success:0,msg:"somthings wents wrong !"});
		}
	})
})

router.get('/getUserBetHistory', common.tokenMiddleware, function (req, res) {
    betHistory.find({'users.user_id': mongoose.mongo.ObjectId(req.userId)},{server_seed:1,_id:1,created_at:1,bet_result:1,users:1}).sort({_id : -1}).limit(100).exec(function(err1, res1){
        if(res1){
        	// var data = res1.shift();
          return res.json({success:1,msg:res1});
        }else{
            return res.json({success:0,msg:"Somthing wents wrong !"});
        }
    })
});

router.post('/userFav',common.userVerify, function (req, res) {
	var userId = req.userId;
	var game=req.body.name;let count ;var deleted;
	users.findOne({'_id':userId}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something wents wrong !"});	
		}
		if(resp){
			// if(resp.user_favourites.length > 0){
				var fav=resp.user_favourites.length;
				if (!resp.user_favourites.includes(game)) {
				  	resp.user_favourites.push(game);
				  	count = resp.user_favourites.length;
				}else{
				  	const index = resp.user_favourites.indexOf(game);
				  	resp.user_favourites.splice(index, 1);
				  	count = resp.user_favourites.length;
				}

				var storeData=resp.user_favourites;
				var tot = (fav >= count) ? "not" : "added";
				if(tot =="added"){
					users.updateOne({'_id':userId},{'user_favourites':storeData}).exec(function(errs,resData){
						if(errs){
							return res.json({success:0,msg:"Please try again"});	
						}
						if(resData){
							gamelist.updateOne({'game_name':'bustabit'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"bustabit"});	
								}
							})
						}
					})
				}else{
					users.updateOne({'_id':userId},{'user_favourites':storeData}).exec(function(errs,resData){
						if(errs){
							return res.json({success:0,msg:"Please try again"});	
						}
						if(resData){
							gamelist.updateOne({'game_name':'bustabit'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Remove From Favourites",game:""});	
								}
							})
						}
					})
				}
			// }
		}
	})
})


router.post('/userLiked',common.userVerify, function (req, res) {
	var userId = req.userId;
	var game=req.body.name;let count ;var deleted;
	users.findOne({'_id':userId}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something wents wrong !"});	
		}
		if(resp){
			// if(resp.liked_game.length > 0){
				var fav=resp.liked_game.length;
				if (!resp.liked_game.includes(game)) {
				  	resp.liked_game.push(game);
				  	count = resp.liked_game.length;
				}else{
				  	const index = resp.liked_game.indexOf(game);
				  	resp.liked_game.splice(index, 1);
				  	count = resp.liked_game.length;
				}

				var storeData=resp.liked_game;
				var tot = (fav >= count) ? "not" : "added";
				if(tot =="added"){
					users.updateOne({'_id':userId},{'liked_game':storeData}).exec(function(errs,resData){
						if(errs){
							return res.json({success:0,msg:"Please try again"});	
						}
						if(resData){
							gamelist.updateOne({'game_name':'bustabit'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"bustabit"});	
								}
							})
						}
					})
				}else{
					users.updateOne({'_id':userId},{'liked_game':storeData}).exec(function(errs,resData){
						if(errs){
							return res.json({success:0,msg:"Please try again"});	
						}
						if(resData){
							gamelist.updateOne({'game_name':'bustabit'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Remove From Liked Game",game:""});
								}
							})
						}
					})
				}
			// }
		}
	})
})

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	/*gamelist.findOne({game_name:'bustabit'}).exec(function(err1, res1){
        if(res1){
           	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
        } else {res.json({success:0});}
	})*/

	gamelist.findOne({game_name:'bustabit'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
		if(resData){
	      	if(resData.Curr.length > 0){
	        	let min_bet = resData.Curr[0].min_bet;
	        	let max_bet = resData.Curr[0].max_bet;
	           	res.json({success:1,min_bet:min_bet, max_bet:max_bet});
	      	} else {
	     		res.json({success:0, min_bet:0, max_bet:0});
	      	}
		}else{
			res.json({success:0, min_bet:0, max_bet:0});
		}
	});
});

router.post('/getgraphed',common.userVerify, function (req, res) {
	var userid=req.userId;var time=req.body.time
	var game = req.body.game;

	async.parallel({
		first:function(callback){
			betHistory.aggregate([
				{'$unwind': '$users'}, {'$project': {'_id': 0, 'user_id': '$users.user_id', 'time_status': '$users.time_status', 'created_at': 1, 'bet_amount': '$users.bet_amount', 'win_lose_amt': '$users.win_lose_amt', 'status': '$users.status'}}, 
			  	{'$match': {'user_id': mongoose.mongo.ObjectId(userid), 'time_status': 0, '$expr': {'$eq': [{'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},{'$dateToString': {'format': '%Y-%m-%d', 'date': new Date('Wed, 18 Oct 2023 13:09:00 GMT')}}]}}},
			  	{'$group': {'_id': null, 'wagered': {'$sum': '$bet_amount'}, 'profit': {'$sum': '$win_lose_amt'}, 'win': {'$sum': {'$cond': [{'$eq': ['$status', 'winner']}, 1, 0]}}, 'loss': {'$sum': {'$cond': [{'$eq': ['$status', 'loser']}, 1, 0]}}}},
			  	{'$project': {'pofit': '$profit', '_id': 0, 'win': 1, 'loss': 1, 'wagered': 1}}
			]).exec(callback);
		},
		second:function(callback) {
			betHistory.aggregate([
			  {'$unwind': '$users'}, 
			  {'$project': {'_id': 0, 'user_id': '$users.user_id', 'time_status': '$users.time_status', 'created_at': 1, 'bet_amount': '$users.bet_amount', 'win_lose_amt': '$users.win_lose_amt', 'status': '$users.status'}}, 
			  {'$match': {'user_id': mongoose.mongo.ObjectId(userid), 'time_status': 0, '$expr': {'$eq': [{'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}}, {'$dateToString': {'format': '%Y-%m-%d', 'date': new Date('Wed, 18 Oct 2023 13:31:29 GMT')}}]}}}, 
			  {'$group': {'_id': null, 'wagered': {'$sum': '$bet_amount'}, 'profit': {'$sum': {'$cond': [{'$eq': ['$status', 'winner']}, '$win_lose_amt', 0]}}, 'win': {'$sum': {'$cond': [{'$eq': ['$status', 'winner']}, 1, 0]}}, 'loss': {'$sum': {'$cond': [{'$eq': ['$status', 'loser']}, 1, 0]}}}}, 
			  {'$project': {'pofit': '$profit', '_id': 0, 'win': 1, 'loss': 1, 'wagered': 1}}
			]).exec(callback)
		}
	},function(err,resData){
		if(resData){
			return res.json({success:1,msg:resData.first,profit:resData.second})
		}else{
			return res.json({success:0,msg:"Something wents wrong !"});
		}
	})
})

router.post('/getExacttime',common.userVerify, function (req, res) {
	var userid=req.userId; var game = req.body.game;
	// betHistory.updateMany({'user_id':userid}, { $set: { time_status: 1 } }, function(err, result) {
	betHistory.updateMany({},{"$set":{"users.$[elem].time_status": 1}}, { arrayFilters: [ {"elem.user_id": userid}]}, {multi:true}, function(err, result) {
	    if (err) {
			return res.json({success:0,msg:"Something wents wrong !"});
	    }
	    if(result){
			return res.json({success:1,msg:""});
	    }
	})
})

module.exports = { router, SocketInit, receiveInfo };