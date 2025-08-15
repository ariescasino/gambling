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
const endecrypt = require('../helpers/encrypt');

const game = require('../helpers/game');

//schemas
const users = require('../model/users');
const logs = require('../model/user_history');
const currency = require('../model/currency');
const wallet = require('../model/userWallet');
const userHash = require('../model/user_hash');
const betHistory = require('../model/cave_bethistory');
const gamelist = require('../model/gamelist');
const crypto = require('crypto');
const profitDb = require('../model/profit');

function getGameResult() {
	const vary = ['book','cross','diamond','skull','none'];
	const randomIndex = Math.floor(Math.random() * vary.length);
  return vary[randomIndex];
}

function getRandomInt(min, max) {
  const range = max - min + 1;
  const buffer = crypto.randomBytes(4);
  const randomInt = buffer.readUInt32BE(0);
  return min + Math.floor(randomInt / (0xffffffff / range + 1));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

router.post('/saveBetHistory', common.userVerify, async function(req, res){
	var currency  	= req.body.currency;
	var bet_amount  = req.body.bet_amount;
	var userId 		  = req.userId;
	var book_payout     = req.body.book_payout;
	var cross_payout    = req.body.cross_payout;
	var diamond_payout  = req.body.diamond_payout;

	var book_payout_list    = [0, 1.6, 5.0, 10.5];
  var cross_payout_list   = [0, 4.0, 13.0, 28.5, 53.0, 88.0, 137.5, 205.05];
  var diamond_payout_list = [0, 2.5, 8.0, 16.5, 28.5, 45.05];

  var book_payout_status    = "none";
  var cross_payout_status   = "none";
  var diamond_payout_status = "none";
	var reward_payout = 0;
	common.findUserBalance(userId, currency, async function(userBalance){ 
		if(bet_amount <= userBalance) {

			userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp){
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"caveofplunder");
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"caveofplunder"}, {"$set": {nonce: nounce+1}}).exec(async function(err1, res1){
					var amount = bet_amount;
					var updated_balance = userBalance - amount;
					var balance = await common.updateUserBalance(userId, currency, updated_balance);
					var result = await game.caveGameResult(serverSeed, clientSeed, nounce);
  				var bet_result = result
  				if(bet_result == "skull" || bet_result == "none") {  				
  					 var status = "loser";
  					 if(bet_result == "skull") {
  					 		var payout_sum = book_payout + cross_payout + diamond_payout;
  					 		var win_lose_amt = payout_sum * bet_amount;

  					 		var payoutIndex = book_payout_list.indexOf(book_payout);
  					 		if(payoutIndex == 0) {
  					 				var payout = book_payout_list[0];
  					 		} else {
  					 				var payout = book_payout_list[payoutIndex-1];
  					 		}
  							book_payout = payout;

  							payoutIndex = cross_payout_list.indexOf(cross_payout);
  							if(payoutIndex == 0) {
  					 				var payout = cross_payout_list[0];
  					 		} else {
  					 				var payout = cross_payout_list[payoutIndex-1];
  					 		}
  							cross_payout = payout;

  							payoutIndex = diamond_payout_list.indexOf(diamond_payout);
  							if(payoutIndex == 0) {
  					 				var payout = diamond_payout_list[0];
  					 		} else {
  					 				var payout = diamond_payout_list[payoutIndex-1];
  					 		}
  							diamond_payout = payout;

  							payout = payout_sum;
  					 } else {
  					 		var win_lose_amt = bet_amount;
  					 		var payout = 0;
  					 }

  				} else {
  						var status = "winner";
  						if(bet_result == "book") {
  								var payoutIndex = book_payout_list.indexOf(book_payout);
  								if(book_payout_list.length == (payoutIndex+1)) {
  										var payout = book_payout;

  										updated_balance = updated_balance + (bet_amount * 7.5);
											var balance = await common.updateUserBalance(userId, currency, updated_balance);

  										reward_payout = 7.5
  										book_payout_status = "reward";
  								} else {
  										var payout = book_payout_list[payoutIndex+1];
  								}
  								book_payout = payout;
  						} else if(bet_result == "cross") {
  								var payoutIndex = cross_payout_list.indexOf(cross_payout);
  								if(cross_payout_list.length == (payoutIndex+1)) {
  										
  										cross_payout_status = "spin";
  										reward_payout = game.caveWheelResult(serverSeed, clientSeed, nounce);
  										// generate random spin value.
  										var payout = reward_payout;
  								} else {
  										var payout = cross_payout_list[payoutIndex+1];
  								}
  								cross_payout = payout;
  						} else if(bet_result == "diamond") {
  								var payoutIndex = diamond_payout_list.indexOf(diamond_payout);
  								if(diamond_payout_list.length == (payoutIndex+1)) {
  										var payout = diamond_payout;
  										reward_payout = 21.0;
  										diamond_payout_status = "reward";

  										updated_balance = updated_balance + (bet_amount * 21.0);
											var balance = await common.updateUserBalance(userId, currency, updated_balance);

  								} else {
  										var payout = diamond_payout_list[payoutIndex+1];
  								}
  								diamond_payout = payout;
  						}

  						var win_lose_amt = bet_amount * (payout - 1);
  				}

  				var total_payout = book_payout + cross_payout + diamond_payout;
  				if(reward_payout != 0) {
  						total_payout = total_payout + reward_payout;
  				}

  				var winning_amount = total_payout * bet_amount;

					var obj = {
						user_id 	   : mongoose.mongo.ObjectId(userId),
						game 		     : "caveofplunder",
						bet_amount 	 : bet_amount,
						currency 	 	 : currency,
						status 		   : status,
						payout 		   : payout,
						win_lose_amt : win_lose_amt,
						bet_result 	 : bet_result,
						client_seed  : clientSeed,
						server_seed  : serverSeed,
						nonce 		   : nounce
					};

					betHistory.create(obj, function(err, resData) {
							if(err) {
								res.json({success:0,msg:"Please try again"});
							}
							if(resData) {
								betHistory.find({user_id:mongoose.mongo.ObjectId(userId), game:"caveofplunder"}).sort({_id : -1}).exec(function(err2, res2){
									var encData = {book_payout:book_payout,cross_payout:cross_payout, diamond_payout:diamond_payout,winning_amount:winning_amount};
									var encJson = JSON.stringify(encData);
									var encrpayout = encrypt.encryptNew(encJson);
									users.updateOne({"_id":userId,"gamecount.name":"caveofplunder"},{$inc:{"gamecount.$.count":1}},(ers,doc)=>{
		    						if(doc){
										 	res.json({success:1, balance : updated_balance, currency: currency, status:status, history : res2, bet_result:bet_result, book_payout:book_payout,cross_payout:cross_payout, diamond_payout:diamond_payout, total_payout:total_payout, winning_amount:winning_amount, reward_payout:reward_payout, encrpayout:encrpayout, book_payout_status:book_payout_status,cross_payout_status:cross_payout_status,diamond_payout_status:diamond_payout_status});
		    						}else{
           						res.json({success:0,msg:"Something went wrong"});
		    						}
		    					})
								})
							}
					});

				});

			});

		} else {
       res.json({success:0,msg:"You are looser."});
    }
	});
});

router.post('/recallData', common.userVerify, function(req, res) {
	if(req.body.gameCode !== '' && req.body.gameCode !== undefined && req.body.gameCode !== null){
		var decrtype = encrypt.decryptNew(req.body.gameCode);
		var returnData = JSON.parse(decrtype); 
		res.json({success:1, data: returnData});
	}else{
		res.json({success:0,msg:"enter valid details"});
	}
})

router.post('/collectCashPot', common.userVerify, function(req, res) {
	var currency  	= req.body.currency;
	var userId 		  = req.userId;
	var book_payout     = req.body.book_payout;
	var cross_payout    = req.body.cross_payout;
	var diamond_payout  = req.body.diamond_payout;

	var cashpot = req.body.cashpot;

	common.findUserBalance(userId, currency, async function(userBalance){
			var updated_balance = userBalance + cashpot;
			var balance = await common.updateUserBalance(userId, currency, updated_balance);
			res.json({success : 1, balance:updated_balance, book_payout:0, cross_payout:0, diamond_payout: 0});
	});
})

/*function getDefinedResult()
{
	return {"1": 1.03,"2": 1.08,"3": 1.13,"4": 1.18,"5": 1.24,"6": 1.30,"7": 1.38}
}

function calculatePayout()
{

}*/

router.post('/checkresult', common.userVerify, function(req, res) {
	var userId = req.userId;
	var betId  = req.body.betId;
	var choosenumber = req.body.choosenumber;

	var bet_result = [];
	betHistory.findOne({_id:mongoose.mongo.ObjectId(betId), user_id:mongoose.mongo.ObjectId(userId),status:"pending"}).exec(async function(err, resp){
		if(resp) {
			var mines_result = resp.mines_result;
			if(mines_result.includes(choosenumber)) {
				var new_bet_result = {userchoice:choosenumber, bet_result:"mines"};
				var win_lose_amt = resp.bet_amount;
				betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push":{bet_result:new_bet_result}, "$set": {status:"loser",payout:0,win_lose_amt:win_lose_amt}}).exec(function(err1, resp1) {
					betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
						res.json({success:1, result:"mines", mines_result:resp.mines_result, history : res2});
					})
				});
			} else {

				if(resp.payout == 0) {
					var payoutList = [1.03,1.08,1.13,1.18,1.24,1.30,1.38];
					var payout = payoutList[resp.no_of_mines - 1];
				} else {
					var payout = resp.payout - 1;
					payout = (payout * 2) + 1;
				}
				payout = payout.toFixed(2);
				var next_payout = ((payout - 1) * 2) + 1;
				var new_bet_result = {userchoice:choosenumber, bet_result:"diamond"};

				if(Object.keys(resp.bet_result).length == (24 - resp.no_of_mines)) {
					betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout}}).exec(function(err1, resp1) {
						
						common.findUserBalance(userId, resp.currency, async function(balance){
							var win_lose_amt = payout * resp.bet_amount;
							var updated_balance = balance + win_lose_amt;
							var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);


							betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								res.json({success:1, result:"winner", mines_result:resp.mines_result, payout:payout, win_amount:win_lose_amt, history : res2});
							})
						});
					});
				} else {
					betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"pending",payout:payout,win_lose_amt:win_lose_amt}}).exec(function(err1, resp1) {

						res.json({success:1, result:"diamond",payout:payout, next_payout:next_payout.toFixed(2)});

					});
				}
			}
		} else {
			res.json({success:2, result:"game expired"});
		}
	});
});

router.post('/cashout', common.userVerify, function(req, res) {
	var userId = req.userId;
	var betId  = req.body.betId;
	betHistory.findOne({_id:mongoose.mongo.ObjectId(betId), user_id:mongoose.mongo.ObjectId(userId),status:"pending"}).exec(async function(err, resp){
		if(resp) {
			common.findUserBalance(userId, resp.currency, async function(balance){
				var win_lose_amt = resp.payout * resp.bet_amount;
				var updated_balance = balance + win_lose_amt;
				var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);
				betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$set": {status:"winner",win_lose_amt:win_lose_amt}}).exec(function(err1, resp1) {
					betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
						res.json({success:1, mines_result:resp.mines_result, payout:resp.payout, win_amount:win_lose_amt, history : res2});
					})
				});
			});
		} else {
			res.json({success:2, result:"game expired"});
		}
	})
});

router.post('/saveAutoBet', common.userVerify, function(req, res) {
	var currency 	= req.body.currency;
	var bet_amount  = req.body.bet_amount;
	var mines 		= req.body.mines;
	var userId 		= req.userId;
	var userchoice  = req.body.user_choice;

	if(userchoice.length == 0)
	{
		return res.json({success:0,msg:"Please choose tiles"});
	}

	common.findUserBalance(userId, currency, async function(userBalance){ 
		if(bet_amount <= userBalance) {
			userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp){
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"caveofplunder");
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"caveofplunder"}, {"$set": {nonce: nounce+1}}).exec(async function(err1, res1){
					var amount = bet_amount;
					var updated_balance = userBalance - amount;
					var balance = await common.updateUserBalance(userId, currency, updated_balance);
					var result = await game.minesGameResult(serverSeed, clientSeed, nounce,  mines);
					var obj = {
						user_id 	 : mongoose.mongo.ObjectId(userId),
						game 		 : "caveofplunder",
						bet_amount 	 : bet_amount,
						currency 	 : currency,
						status 		 : "pending",
						mines_result : result,
						no_of_mines  : mines,
						payout 		 : 0,
						client_seed  : clientSeed,
						server_seed  : serverSeed,
						nonce 		 : nounce,
					};

					betHistory.create(obj, async function(err, resData) {
						var payoutList = [1.03,1.08,1.13,1.18,1.24,1.30,1.38];
						var payout = payoutList[mines - 1];
						var status = "mine";
						for(const element of userchoice) {
							if(result.includes(element)) {
								var new_bet_result = {userchoice:element, bet_result:"mines"};
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push":{bet_result:new_bet_result}, "$set": {status:"loser",payout:0}}).exec();
								return res.json({success:1, result:"mines", mines_result:result});
							} else {
								payout = payout - 1;
								payout = (payout * 2) + 1;
								var new_bet_result = {userchoice:element, bet_result:"diamond"};
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"pending",payout:payout}}).exec();

								status = "diamond";
							}
						}

						if(status == "diamond") {
							common.findUserBalance(userId, currency, async function(balance){
								var win_lose_amt = payout * bet_amount;
								var updated_balance = balance + win_lose_amt;

								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout,win_lose_amt:win_lose_amt}}).exec(async function(err1, resp1) {
									var balance = await common.updateUserBalance(userId, currency, updated_balance);
									betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2) {
										return res.json({success:1, result:"winner", mines_result:result, payout:payout, win_amount:win_lose_amt, history : res2});
									})
								});
							});	
						}
					});
				});
			});
		} else {
           	res.json({success:0,msg:"You are looser."});
        }
	});
	
});


function checkResult(userId, betId, choosenumber)
{
	betHistory.findOne({_id:mongoose.mongo.ObjectId(betId), user_id:mongoose.mongo.ObjectId(userId),status:"pending"}).exec(async function(err, resp){
		if(resp) {
			var mines_result = resp.mines_result;
			if(mines_result.includes(choosenumber)) {
				var new_bet_result = {userchoice:choosenumber, bet_result:"mines"};
				betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push":{bet_result:new_bet_result}, "$set": {status:"loser",payout:0}}).exec(function(err1, resp1) {
					res.json({success:1, result:"mines", mines_result:resp.mines_result});
				});
			} else {

				if(resp.payout == 0) {
					var payoutList = [1.03,1.08,1.13,1.18,1.24,1.30,1.38];
					var payout = payoutList[resp.no_of_mines - 1];
				} else {
					var payout = resp.payout - 1;
					payout = (payout * 2) + 1;
				}
				payout = payout.toFixed(2);
				var next_payout = ((payout - 1) * 2) + 1;
				var new_bet_result = {userchoice:choosenumber, bet_result:"diamond"};

				if(Object.keys(resp.bet_result).length == (24 - resp.no_of_mines)) {
					common.findUserBalance(userId, resp.currency, async function(balance){
						var win_lose_amt = payout * resp.bet_amount;
						var updated_balance = balance + win_lose_amt;

						betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout,win_lose_amt:win_lose_amt}}).exec(async function(err1, resp1) {
							
							var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);
							betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								res.json({success:1, result:"winner", mines_result:resp.mines_result, payout:payout, win_amount:win_lose_amt, history : res2});
							})
						});
					});
				} else {
					betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"pending",payout:payout}}).exec(function(err1, resp1) {

						res.json({success:1, result:"diamond",payout:payout, next_payout:next_payout.toFixed(2)});

					});
				}
			}
		} else {
			res.json({success:2, result:"game expired"});
		}
	});
}

router.post('/getGameResult1', common.userVerify, function(req, res) {
	// need to check user balance.
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	common.findUserBalance(userId, currency, function(balance){
		if(balance >= bet_amount) {
			userHash.findOne({user_id:userId,game:"mines"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}	
				
				if(resp) {
					var result = game.limboGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "mines");
					var result = game.limboGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}

				userHash.updateOne({user_id:userId,game:"mines"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
						return res.json({success:1,result:result, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce});
				}); 
			});
		} else {
			return res.json({success:0, msg:"Insufficient Balance"});
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

	userHash.updateOne({user_id:userId, game:"caveofplunder"}, {"$set": {client_seed:client_seed,server_seed:server_seed,nonce:nonce,new_client_seed:new_client_seed,new_server_seed:new_server_seed}}).exec(function(err, resp){

		if(resp) {
			return res.json({success:1,new_server_seed:new_server_seed, new_client_seed:new_client_seed});
		}

		if(err) {
			return res.json({success:0,msg:"Please try again"});
		}
	})
});


router.post('/getUserHash', common.userVerify, function(req, res){
	var userId = mongoose.mongo.ObjectId(req.userId);
	userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(function(err, resp){
		if(err) {
			return res.json({success:0,msg:"Please try again."});
		}

		if(resp) {
			return res.json({success:1, result:resp});
		}
	});
});


router.post('/getBetHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"caveofplunder"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

// router.post('/getBetFullHistory', common.userVerify, function(req, res){
// 	var userId = req.userId;
// 	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"caveofplunder"}).sort({_id : -1}).exec(function(err1, res1){
// 		res.json({success:1, history : res1});
// 	})
// });

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({game:"caveofplunder"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
        if(res1.length !== 0){
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
            return res.json({success:1,msg:[] });
        }
    })
});

router.post('/getAllBetHis', function (req, res) {
    betHistory.find({game:"caveofplunder"}).exec(function(err1, res1){
        if(res1){
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

    userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(async function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "mines");
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
    
    userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(function(err, resp) {
      if(err) {
          return res.json({success:0,msg:"Please try again"});
      }   
      if(resp){
          userHash.updateOne({user_id:userId,game:"caveofplunder"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
              if(errs){
                return res.json({success:0,msg:"Something went wrong"});
              }
              if(resData){
              	betHistory.updateMany({user_id:userId,server_seed:oldserverSeed,game:"caveofplunder"},{$set:{seed_status:1}}).exec(function(err1,resp1){
							    if(err1){ 
                  	return res.json({success:0,msg:"Something went wrong"});
							    }
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

    userHash.findOne({user_id:userId,game:"caveofplunder"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"caveofplunder"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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
							gamelist.updateOne({'game_name':'caveofplunder'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"caveofplunder"});
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
							gamelist.updateOne({'game_name':'caveofplunder'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Remove From Favourites",game:"caveofplunder"});
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
					users.updateOne({'_id':userId},{	'liked_game':storeData}).exec(function(errs,resData){
						if(errs){
							return res.json({success:0,msg:"Please try again"});	
						}
						if(resData){
							gamelist.updateOne({'game_name':'caveofplunder'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"caveofplunder"});	
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
							gamelist.updateOne({'game_name':'caveofplunder'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Remove From Liked Game",game:"caveofplunder"});	
								}
							})
						}
					})
				}
			// }
		}
	})
})

router.post('/getDetails',common.userVerify, function (req, res) {
	var userId = req.userId;var _id=req.body._id;var game=req.body.game;
	betHistory.findOne({'_id':_id,'user_id':userId,'game':game}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something wents wrong !"});	
		}
		if(resp){
			const serverSeed = resp.server_seed;
      const clientSeed  = resp.client_seed;

      var serverSeed1 = endecrypt.withDecrypt(serverSeed);
    	var clientSeed2 = endecrypt.withDecrypt(clientSeed);

      const nounce= parseInt(resp.nonce);

      var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
      let val=hmacWA.toString();

      var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
      var fss=hmacDirectWA.toString();

      users.findOne({'_id':userId},{username:1,_id:0}).exec(function(Errs,Resp) {
      	if(Errs){
					return res.json({success:0,msg:"Somthings wents wrong !"});	
      	}
      	if(Resp){
      		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}

      		res.json({success:1,msg:data})
      	}
      })
		}
	})
});

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	/*gamelist.findOne({game_name:'caveofplunder'}).exec(function(err1, res1){
    if(res1){
       	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
    } else {res.json({success:0});}
	})*/
	gamelist.findOne({game_name:'caveofplunder'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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