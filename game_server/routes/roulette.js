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
const betHistory = require('../model/roulette_bethistory');
const gamelist = require('../model/gamelist');
const profitDb = require('../model/profit');

router.post('/getGameResult1', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	common.findUserBalance(userId, currency, async function(balance){
		if(balance >= bet_amount) {
			userHash.findOne({user_id:userId,game:"roulette"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp) {
					var result = game.coinflipGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "roulette");
					var result = game.coinflipGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"roulette"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
					return res.json({success:1,result:result, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce});
				});
			});
		} else {
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	});
});

router.post('/saveBetHistory', common.userVerify, async function(req, res){
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	var bet_result = req.body.bet_result;
	var amount = req.body.amount;
	var pay_out = req.body.payout;
	var userId = req.userId;
	var winning_status = req.body.status;
	var userclientId = req.body.userId;
	common.findUserBalance(userId, currency, async function(userBalance){ 
		if(bet_amount <= userBalance) {
			if(winning_status == "winner") {
				var updated_balance = userBalance + amount;
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
				var status = "winner";
			}
			userHash.findOne({user_id:userId,game:"roulette"}).exec(async function(err, resp) {
				if(resp){
					var result = game.kenoGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"roulette");
					var result = game.kenoGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				var add_bal = parseFloat(bet_amount) * parseFloat(pay_out);
				if(parseFloat(add_bal) < parseFloat(bet_amount)){
					var profit = parseFloat(bet_amount)-parseFloat(add_bal);
				}else if(parseFloat(add_bal) > parseFloat(bet_amount)){
					var profit = parseFloat(add_bal)-parseFloat(bet_amount);
				}
				var obj = {
					user_id 	 : mongoose.mongo.ObjectId(userId),
					game 		 : "roulette",
					bet_amount 	 : bet_amount,
					currency 	 : currency,
					payout 		 : pay_out,
					win_lose_amt : profit,
					bet_result	 : bet_result,
					status 		 : winning_status,
					client_seed  : clientSeed,
					server_seed  : serverSeed,
					nonce  		 : nounce,
				};
				if(userclientId !== undefined && userclientId !== ""&& userclientId !== null){
					var encuId = encrypt.decryptNew(userclientId);
					betHistory.findOne({_id: mongoose.mongo.ObjectId(encuId)}).exec(function(err, resupd){
						if(resupd){
							betHistory.updateOne({_id: mongoose.mongo.ObjectId(encuId), user_id: mongoose.mongo.ObjectId(userId)},{"$set":obj}).exec(function(errval, resVal){
								if(resVal){
									betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}, game:"roulette"}).sort({_id : -1}).exec(function(err1, res1){
									 	users.updateOne({"_id":userId,"gamecount.name":"roulette"},{$inc:{"gamecount.$.count":1}},(ers,doc)=>{
				    						if(doc){
				    							common.wagecountUpdate(currency,userId,bet_amount,profit,winning_status,"roulette",function(data) {})
												common.gamecountUpdate(userId,"roulette",winning_status,currency,function(data) {})
											 	res.json({success:1,status:obj.status, balance : updated_balance, currency: currency, history : res1, userId:userclientId, coinData: obj});
				    						}else{
				           						res.json({success:0,msg:"Something went wrong"});
				    						}
				    					})
									})
								}else{
									res.json({success:0, msg: "failed to update !"});
								}
							})
						}else{
							res.json({success:0, msg: "somthing wents wrong !"});
						}
					})
				}else{
					betHistory.create(obj, function(err, resData) {
						if(resData) {
							var encuId = encrypt.encryptNew(resData._id.toString());
							betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}, game:"roulette"}).sort({_id : -1}).exec(function(err1, res1){
							 	users.updateOne({"_id":userId,"gamecount.name":"roulette"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
		    						if(doc){
		    							common.wagecountUpdate(currency,userId,bet_amount,profit,winning_status,"roulette",function(data) {})
										common.gamecountUpdate(userId,"roulette",winning_status,currency,function(data) {})
									 	res.json({success:1, balance : updated_balance, currency: currency, history : res1, userId:encuId, coinData: resData});
		    						}else{
		           						res.json({success:0,msg:"Something went wrong"});
		    						}
		    					})
							})
						}else{
							res.json({success:0, msg: "somthing wents wrong !"});
						}
					});
				}
			})
		}else {
        	res.json({success:0,msg:"You are looser."});
        }
	});
});

router.post('/getUserHash', common.userVerify, function(req, res){
	var userId = mongoose.mongo.ObjectId(req.userId);
	userHash.findOne({user_id:userId,game:"roulette"}).exec(function(err, resp){
		if(err) {
			return res.json({success:0,msg:"Please try again."});
		}

		if(resp) {
			return res.json({success:1, result:resp});
		}
	});
});

router.post('/updateUserHash', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var client_seed = req.body.client_seed;
	var server_seed = req.body.server_seed;
	var nonce 		= req.body.nonce;
	var new_client_seed = common.randomString(15);
	var new_server_seed = common.randomString(32);
	userHash.updateOne({user_id:userId, game:"roulette"}, {"$set": {client_seed:client_seed,server_seed:server_seed,nonce:nonce,new_client_seed:new_client_seed,new_server_seed:new_server_seed}}).exec(function(err, resp){
		if(resp) {
			return res.json({success:1,new_server_seed:new_server_seed, new_client_seed:new_client_seed});
		}

		if(err) {
			return res.json({success:0,msg:"Please try again"});
		}
	})
});
router.post('/getBetHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"roulette"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({game:"roulette"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
        if(res1.length !==0){
            var i = 1; var len = res1.length;var storeData=[];
            res1.forEach((value) => {
                let id=value.user_id
                users.findOne({'_id':value.user_id},{username:1,_id:0}).exec(function(err,resp){
                    var obj={betid:value._id,player:resp.username,time:value.created_at,payout:value.payout,profit:value.win_lose_amt,status:value.status}
                        storeData.push(obj)
                        if(i==len){ res.json({success:1,msg:storeData}); }
                        i =i + 1;
                })
            })
        }else{
            return res.json({success:1,msg: [] });
        }
    })
});


router.post('/getHash',common.userVerify, function (req, res) {
    var userId = req.userId;

    userHash.findOne({user_id:userId,game:"roulette"}).exec(async function(err, resp) {
        if(err) { return res.json({success:0,msg:"Please try again"}); }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "roulette");
        	res.json({success:1, serverSeed:user_has.server_seed, clientSeed:user_has.client_seed, nounce:user_has.nonce, newSer:user_has.new_server_seed, newCli:user_has.new_client_seed});
        }  
    })
})

router.post('/changeHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var serverSeed = req.body.newserverSeed;
    var clientSeed = req.body.newclientSeed;
    var oldserverSeed = req.body.oldserverSeed;

    var nounce = req.body.nonce;
    var newSer = encrypt.withEncrypt(common.randomString(24));
    var newCli = encrypt.withEncrypt(common.randomString(12));
    
    userHash.findOne({user_id:userId,game:"roulette"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"roulette"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                    betHistory.updateMany({user_id:userId,server_seed:oldserverSeed,game:"roulette"},{$set:{seed_status:1}}).exec(function(err1,resp1){
						if(err1){ return res.json({success:0,msg:"Something went wrong"});}
						if(resp1){ return res.json({success:1,msg:"Seed Changed"}) };
					})
                }
            })
        }
    })
})

router.post('/generateHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var newCli = encrypt.withEncrypt(common.randomString(12));
    var nounce = req.body.nonce;
    var serverSeed=req.body.newserverSeed;
    var clientSeed=req.body.newclientSeed;

    userHash.findOne({user_id:userId,game:"roulette"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"roulette"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
                if(errs){
                    return res.json({success:0,msg:"Something wrong"});
                }
                if(resData){
                	res.json({success:1,msg:newCli});
                }
            });
        }
    });
});

router.post('/getDetails',common.userVerify, function (req, res) {
	var userId = req.userId;var _id=req.body._id;var game=req.body.game;
	betHistory.findOne({'_id':_id,'user_id':userId,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something went wrong !"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
            const clientSeed  = resp.client_seed;
            const nounce= parseInt(resp.nonce);
            var serverSeed1 = encrypt.withDecrypt(serverSeed);
    		var clientSeed2 = encrypt.withDecrypt(clientSeed);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':userId},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,msg:"Something went wrong !"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,userbet:resp.userBet,bet_result:resp.bet_result,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}
            		res.json({success:1,msg:data})
            	}
            })
		}
	})
});

router.post('/userFav',common.userVerify, function (req, res) {
	var userId = req.userId;
	var game=req.body.name;let count ;var deleted;
	users.findOne({'_id':userId}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something went wrong !"});	
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
							gamelist.updateOne({'game_name':'roulette'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"roulette"});
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
							gamelist.updateOne({'game_name':'roulette'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
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
			return res.json({success:0,msg:"Something went wrong !"});	
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
							gamelist.updateOne({'game_name':'roulette'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"roulette"});	
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
							gamelist.updateOne({'game_name':'roulette'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
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
});

router.post('/getGameResult', common.userVerify, function (req, res){
	var info = req.body;
	var betValue = info.betvalue;
	var bet_amount = info.amount;
	var currency = info.currency;
	var userId = mongoose.mongo.ObjectId(req.userId);
	common.findUserBalance(userId, currency, async function(balance){
		if(balance >= bet_amount) {
			userHash.findOne({user_id:userId,game:"roulette"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp) {
					var result = game.rouletteGame(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "roulette");
					var result = game.rouletteGame(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"roulette"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
					payoutloop(betValue,result,async function(payoutData) {
						var add_bal = parseFloat(bet_amount) * parseFloat(payoutData);
						if(parseFloat(add_bal) < parseFloat(bet_amount)){
							var status =  "loser";
							var profit = parseFloat(bet_amount)-parseFloat(add_bal);
							var update_bal = parseFloat(balance)-parseFloat(profit);
							var balanceData = await common.updateUserBalance(userId, currency, update_bal);
						}else if(parseFloat(add_bal) > parseFloat(bet_amount)){
							var status =  "winner";
							var profit = parseFloat(add_bal)-parseFloat(bet_amount);
							var update_bal = parseFloat(balance)+parseFloat(profit);
							var balanceData = await common.updateUserBalance(userId, currency, update_bal);
						}else{
							var status =  "tied";
							var profit = 0;
						}

						if(status == "loser"){
							common.findAdminBal(currency, async function(AdminBal){
								var updatAdBal = parseFloat(AdminBal)+parseFloat(profit);
								var Admbalance = await common.updateAdminBalance(currency, updatAdBal);
							})
							/*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: currency, amount: profit, type: "roulette"}
			                profitDb.create(profitJson, function(proErr, proRes) {
			                    console.log(proRes);
			                })*/
						}

						var obj = {
							user_id 	 : mongoose.mongo.ObjectId(userId),
							game 		 : "roulette",
							bet_amount 	 : bet_amount,
							currency	 : currency,
							payout 		 : payoutData,
							win_lose_amt : profit,
							bet_result	 : result,
							status 		 : status,
							client_seed  : clientSeed,
							server_seed  : serverSeed,
							nonce 		 : nounce,
							userBet  	 : betValue,
						};
						betHistory.create(obj, function(err, resData) {
							if(err) {
								res.json({success:0,msg:"Please try again"});
							}
							if(resData) {
								betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"roulette"}).sort({_id : -1}).exec(function(err2, res2){
									common.sendGameResult(resData);
								 	res.json({success:1,result:result, balance : update_bal, currency: currency, history : res2, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce, status:status, payOut: payoutData, bet_amount:bet_amount});
								})
							}
						});
					});
				})
			});
		}else{
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	})
});

function payoutloop(data, result, callback){
	var wheelnumbersAC = [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];
  	var firstHalfNum=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  	var secondHalfNum=[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36];
  	var firstRowNum=[3,6,9,12,15,18,21,24,27,30,33,36];
  	var secondRowNum=[2,5,8,11,14,17,20,23,26,29,32,35];
  	var thirdRowNum=[1,4,7,10,13,16,19,22,25,28,31,34];
  	var firstSegNum=[1,2,3,4,5,6,7,8,9,10,11,12];
  	var secondSegNum=[13,14,15,16,17,18,19,20,21,22,23,24];
  	var thirdSegNum=[25,26,27,28,29,30,31,32,33,34,35,36];
  	var evenNum=[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36];
  	var oddNum=[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35];
  	var redNum=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  	var balckNum=[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

	var payourRatio=0; len = data.length; var i = 1;
	data.forEach((betval) => {
		if(betval.bet == 'half1'){
			let betResult = firstHalfNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=2}
		}
		if(betval.bet == 'half2'){
			let betResult = secondHalfNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=2}
		}
		if(betval.bet == 'row1'){
			let betResult = firstRowNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=3}
		}
		if(betval.bet == 'row2'){
			let betResult = secondRowNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=3}
		}
		if(betval.bet == 'row3'){
			let betResult = thirdRowNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=3}
		}
		if(betval.bet == 'seg1'){
			let betResult = firstSegNum.filter(val => val == result);
			if(betResult.length !== 0 ){payourRatio +=3}
		}
		if(betval.bet == 'seg2'){
			let betResult = secondSegNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=3}
		}
		if(betval.bet == 'seg3'){
			let betResult = thirdSegNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=3}
		}
		if(betval.bet == 'even'){
			let betResult = evenNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=2}
		}
		if(betval.bet == 'odd'){
			let betResult = oddNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=2}
		}
		if(betval.bet == 'red'){
			let betResult = redNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=2}
		}
		if(betval.bet == 'black'){
			let betResult = balckNum.filter(val => val == result);
			if(betResult.length !== 0){payourRatio +=2}
		}
		if(betval.bet == result){
			payourRatio +=36 
		}
		if(len == i){
			var payout = parseFloat(parseFloat(payourRatio)/parseFloat(data.length));
			callback(payout)
		}
		i = i+1;
    })
}

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	/*gamelist.findOne({game_name:'roulette'}).exec(function(err1, res1){
        if(res1){
           	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
        } else {res.json({success:0});}
	})*/
	gamelist.findOne({game_name:'roulette'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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

module.exports = router;