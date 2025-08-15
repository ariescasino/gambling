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
const betHistory = require('../model/mines_bethistory');
const gamelist = require('../model/gamelist');
const crypto = require('crypto');

const profitDb = require('../model/profit');


function getGameResult(mines) {
	const numValues = mines;
	const min = 1;
	const max = 25;
	const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
	shuffleArray(numbers);
	const result = numbers.slice(0, numValues);
	return result;
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
	var currency 	= req.body.currency;
	var bet_amount  = req.body.bet_amount;
	var mines 		= req.body.mines;
	var userId 		= req.userId;
	var userclientId = req.body.betId;
	
	common.findUserBalance(userId, currency, async function(userBalance){ 
		if(bet_amount <= userBalance) {

			userHash.findOne({user_id:userId,game:"mines"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp){
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"mines");
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"mines"}, {"$set": {nonce: nounce+1}}).exec(async function(err1, res1){
					var amount = bet_amount;
					var updated_balance = userBalance - amount;
					var balance = await common.updateUserBalance(userId, currency, updated_balance);
					var result = await game.minesGameResult(serverSeed, clientSeed, nounce,  mines);
					var obj = {
						user_id 	 : mongoose.mongo.ObjectId(userId),
						game 		 : "mines",
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

					if(userclientId !== undefined && userclientId !== ""&& userclientId !== null){
						var encuId = encrypt.decryptNew(userclientId);
						betHistory.findOne({_id: mongoose.mongo.ObjectId(encuId)}).exec(function(err, resupd){
							if(resupd){
								betHistory.updateOne({_id: mongoose.mongo.ObjectId(encuId), user_id: mongoose.mongo.ObjectId(userId)},{"$set":obj}).exec(function(errval, resVal){
									if(resVal){
										betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}}).sort({_id : -1}).exec(function(err1, res1){
										 	res.json({success:1, balance : updated_balance, currency: currency, history : res1, betId:userclientId, coinData: obj, status:obj.status});
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
								betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}}).sort({_id : -1}).exec(function(err1, res1){
								 	res.json({success:1, balance : updated_balance, currency: currency, history : res1, betId:encuId, coinData: resData, status:obj.status});
								})
							}else{
								res.json({success:0, msg: "somthing wents wrong !"});
							}
						});
					}

					/*betHistory.create(obj, function(err, resData) {
						if(err) {
							res.json({success:0,msg:"Please try again"});
						}
						if(resData) {
							var encuId = encrypt.encryptNew(resData._id.toString());
							res.json({success:1, betId : encuId, status:"pending"});
						}
					});*/

				})
			})

		} else {
      res.json({success:0,msg:"You are looser."});
    }
	});
});

function getDefinedResult()
{
	return {"1": 1.03,"2": 1.08,"3": 1.13,"4": 1.18,"5": 1.24,"6": 1.30,"7": 1.38}
}

function calculatePayout()
{

}


router.post('/checkresult', common.userVerify, function(req, res) {
	var userId = req.userId;
	var betId  = encrypt.decryptNew(req.body.betId);
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
            common.findAdminBal(resp.currency, async function(AdminBal){
              var updatAdBal = parseFloat(AdminBal)+parseFloat(win_lose_amt);
              var Admbalance = await common.updateAdminBalance(resp.currency, updatAdBal);
	            /*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: resp.currency, amount: win_lose_amt, type: "mines"}
              profitDb.create(profitJson, function(proErr, proRes) {
                  console.log(proRes);
              })*/
            })
            users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
							common.wagecountUpdate(resp.currency,userId,win_lose_amt,win_lose_amt,'loser',"mines",function(data) {})
							common.gamecountUpdate(userId,"mines",'loser',resp.currency,function(data) {});

							betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(async function(beterr, betresp){
								common.sendGameResult(betresp);
							})
							
							res.json({success:1, result:"mines", mines_result:resp.mines_result, history : res2, status:'loser'});
						})
					})
				});
			} else {
				// console.log((resp['bet_result'].length)+2);
				var payout = game.MinesBetGameResult(resp['no_of_mines'], (resp['bet_result'].length)+1);
				var next_payout = game.MinesBetGameResult(resp['no_of_mines'], (resp['bet_result'].length)+2);

				/*if(resp.payout == 0) {
					var payoutList = [1.03,1.08,1.13,1.18,1.24,1.30,1.38];
					var payout = payoutList[resp.no_of_mines - 1];
				} else {
					var payoutListIn = [0.2,0.25,0.3,0.35,0.4,0.45,0.5];
					//var payout = resp.payout - 1;
					//payout = (payout * 2) + 1;
					var payout = resp.payout + payoutListIn[resp.no_of_mines - 1];
				}*/
				payout = payout.toFixed(3);
				var payoutListIn = [0.2,0.25,0.3,0.35,0.4,0.45,0.5];
				//var next_payout = ((payout - 1) * 2) + 1;
				// var next_payout = parseFloat(payout) + parseFloat(payoutListIn[resp.no_of_mines - 1]);
				var new_bet_result = {userchoice:choosenumber, bet_result:"diamond"};
				// console.log(next_payout);
				if(Object.keys(resp.bet_result).length == (24 - resp.no_of_mines)) {
					betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout}}).exec(function(err1, resp1) {
						
						common.findUserBalance(userId, resp.currency, async function(balance){
							var win_lose_amt = payout * resp.bet_amount;
							var updated_balance = balance + win_lose_amt;
							var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);

							betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
									common.wagecountUpdate(resp.currency,userId,win_lose_amt,win_lose_amt,'winner',"mines",function(data) {})
									common.gamecountUpdate(userId,"mines",'winner',resp.currency,function(data) {});
									betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(async function(beterr, betresp){
										common.sendGameResult(betresp);
									});
									res.json({success:1, result:"winner", mines_result:resp.mines_result, payout:payout, win_amount:win_lose_amt, history : res2, status:'winner'});
								})
							})
						});
					});
				} else {
					betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"pending",payout:payout,win_lose_amt:win_lose_amt}}).exec(function(err1, resp1) {

						res.json({success:1, result:"diamond",payout:payout, next_payout:next_payout.toFixed(3)});

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
	var betId  = encrypt.decryptNew(req.body.betId);

	betHistory.findOne({_id:mongoose.mongo.ObjectId(betId), user_id:mongoose.mongo.ObjectId(userId),status:"pending"}).exec(async function(err, resp){
		if(resp) {
			common.findUserBalance(userId, resp.currency, async function(balance){
				var win_lose_amt = resp.payout * resp.bet_amount;
				var updated_balance = balance + win_lose_amt;
				var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);
				betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$set": {status:"winner",win_lose_amt:win_lose_amt}}).exec(function(err1, resp1) {
					betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
				 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
							common.wagecountUpdate(resp.currency,userId,win_lose_amt,win_lose_amt,'winner',"mines",function(data) {})
							common.gamecountUpdate(userId,"mines",'winner',resp.currency,function(data) {})
							betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(async function(beterr, betresp){
								common.sendGameResult(betresp);
							})
							res.json({success:1, mines_result:resp.mines_result, payout:resp.payout, win_amount:win_lose_amt, history : res2, status:'winner'});
						})
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
			userHash.findOne({user_id:userId,game:"mines"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp){
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"mines");
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"mines"}, {"$set": {nonce: nounce+1}}).exec(async function(err1, res1){
					var amount = bet_amount;
					var updated_balance = userBalance - amount;
					var balance = await common.updateUserBalance(userId, currency, updated_balance);
					var result = await game.minesGameResult(serverSeed, clientSeed, nounce,  mines);
					var obj = {
						user_id 	 : mongoose.mongo.ObjectId(userId),
						game 		 : "mines",
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
						// var payout = payoutList[mines - 1];
						var payout = game.MinesBetGameResult(mines, userchoice.length);
						var status = "mine";
						var i = 1; var len = userchoice.length; var mineResl=[]

						for(const element of userchoice) {
							if(result.includes(element)) {
								var new_bet_result = {userchoice:element, bet_result:"mines"};
								mineResl.push('mine');
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push":{bet_result:new_bet_result}, "$set": {status:"loser",payout:0}}).exec();
								common.findAdminBal(resData.currency, async function(AdminBal){
	                var updatAdBal = parseFloat(AdminBal)+parseFloat(resData.bet_amount);
	                var Admbalance = await common.updateAdminBalance(resData.currency, updatAdBal);
			            /*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: resData.currency, amount: resData.bet_amount, type: "mines"}
		              profitDb.create(profitJson, function(proErr, proRes) {
		                  console.log(proRes);
		              })*/

									betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
											common.wagecountUpdate(resp.currency,userId,bet_amount,0,'loser',"mines",function(data) {})
											common.gamecountUpdate(userId,"mines",'loser',resp.currency,function(data) {});
											betHistory.findOne({_id:mongoose.mongo.ObjectId(resData._id)}).exec(async function(beterr, betresp){
												common.sendGameResult(betresp);
											})
										})
									})
		            })
							} else {
								/*payout = payout - 1;
								payout = (payout * 2) + 1;*/
								var new_bet_result = {userchoice:element, bet_result:"diamond"};
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"pending",payout:payout}}).exec();
								mineResl.push('diamond');
								status = "diamond";
							}
							if(len == i){
								var winRes = mineResl.filter(val => val == 'mine');
								if(winRes.length !== 0){
									betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
											common.wagecountUpdate(resp.currency,userId,bet_amount,0,'loser',"mines",function(data) {})
											common.gamecountUpdate(userId,"mines",'loser',resp.currency,function(data) {});
											return res.json({success:1, result:"mines", mines_result:result, payout:0, win_amount:0, history : res2, status:'loser'});
										})
									})
								}else{
									common.findUserBalance(userId, currency, async function(balance){
										var win_lose_amt = payout * bet_amount;
										var updated_balance = balance + win_lose_amt;
										betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout,win_lose_amt:win_lose_amt}}).exec(async function(err1, resp1) {
											var balance = await common.updateUserBalance(userId, currency, updated_balance);
											betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2) {
										 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
													common.wagecountUpdate(resp.currency,userId,bet_amount,win_lose_amt,'winner',"mines",function(data) {})
													common.gamecountUpdate(userId,"mines",'winner',resp.currency,function(data) {});
													betHistory.findOne({_id:mongoose.mongo.ObjectId(resData._id)}).exec(async function(beterr, betresp){
														common.sendGameResult(betresp);
													})
													return res.json({success:1, result:"winner", mines_result:result, payout:payout, win_amount:win_lose_amt, history : res2, status:'winner'});
												})
											})
										});
									});
								}
							}
							i=i+1;
						}
						/*if(status == "diamond") {
							common.findUserBalance(userId, currency, async function(balance){
								var win_lose_amt = payout * bet_amount;
								var updated_balance = balance + win_lose_amt;
								betHistory.updateOne({_id:mongoose.mongo.ObjectId(resData._id), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout,win_lose_amt:win_lose_amt}}).exec(async function(err1, resp1) {
									var balance = await common.updateUserBalance(userId, currency, updated_balance);
									betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2) {
								 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
											common.wagecountUpdate(resp.currency,userId,bet_amount,win_lose_amt,'winner',"mines",function(data) {})
											common.gamecountUpdate(userId,"mines",'winner',resp.currency,function(data) {})
											return res.json({success:1, result:"winner", mines_result:result, payout:payout, win_amount:win_lose_amt, history : res2, status:'winner'});
										})
									})
								});
							});
						}*/

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
					common.findAdminBal(resp.currency, async function(AdminBal){
            var updatAdBal = parseFloat(AdminBal)+parseFloat(resp.bet_amount);
            var Admbalance = await common.updateAdminBalance(resp.currency, updatAdBal);
          	/*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: resp.currency, amount: resp.bet_amount, type: "mines"}
            profitDb.create(profitJson, function(proErr, proRes) {
                console.log(proRes);
            })*/
						betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
					 		users.updateOne({"_id":userId,"gamecount.name":"mines"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
								common.wagecountUpdate(resp.currency,userId,bet_amount,resp.bet_amount,'loser',"mines",function(data) {})
								common.gamecountUpdate(userId,"mines",'loser',resp.currency,function(data) {})
								betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(async function(beterr, betresp){
									common.sendGameResult(betresp);
								})
								res.json({success:1, result:"mines", mines_result:resp.mines_result, history : res2, status:'loser'});
							})
						})
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
					common.findUserBalance(userId, resp.currency, async function(balance){
						var win_lose_amt = payout * resp.bet_amount;
						var updated_balance = balance + win_lose_amt;

						betHistory.updateOne({_id:mongoose.mongo.ObjectId(betId), user_id: mongoose.mongo.ObjectId(userId)}, {"$push": {bet_result:new_bet_result},"$set":{status:"winner",payout:payout,win_lose_amt:win_lose_amt}}).exec(async function(err1, resp1) {
							var balance = await common.updateUserBalance(userId, resp.currency, updated_balance);
							betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err2, res2){
								betHistory.findOne({_id:mongoose.mongo.ObjectId(betId)}).exec(async function(beterr, betresp){
									common.sendGameResult(betresp);
								})
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

	userHash.updateOne({user_id:userId, game:"mines"}, {"$set": {client_seed:client_seed,server_seed:server_seed,nonce:nonce,new_client_seed:new_client_seed,new_server_seed:new_server_seed}}).exec(function(err, resp){

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
	userHash.findOne({user_id:userId,game:"mines"}).exec(function(err, resp){
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
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getBetFullHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"mines"}).sort({_id : -1}).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({game:"mines"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
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
            return res.json({success:0,msg: []});
        }
    })
});

router.post('/getAllBetHis', function (req, res) {
    betHistory.find({game:"mines"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
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
            return res.json({success:1,msg: [] });
        }
    })
});

router.post('/getHash',common.userVerify, function (req, res) {
    var userId = req.userId;

    userHash.findOne({user_id:userId,game:"mines"}).exec(async function(err, resp) {
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
    var nounce = req.body.nonce;
    var oldserverSeed = req.body.oldserverSeed;

    var newSer = encrypt.withEncrypt(common.randomString(24));
    var newCli = encrypt.withEncrypt(common.randomString(12));
    
    userHash.findOne({user_id:userId,game:"mines"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"mines"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                  betHistory.updateMany({user_id:userId,server_seed:oldserverSeed,game:"mines"},{$set:{seed_status:1}}).exec(function(err1,resp1){
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

    userHash.findOne({user_id:userId,game:"mines"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"mines"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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
							gamelist.updateOne({'game_name':'mines'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"mines"});
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
							gamelist.updateOne({'game_name':'mines'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
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
							gamelist.updateOne({'game_name':'mines'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"mines"});	
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
							gamelist.updateOne({'game_name':'mines'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
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
      		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}

      		res.json({success:1,msg:data})
      	}
      })
		}
	})
});

router.post('/getcurt', common.userVerify, function(req, res){
	var userId = req.userId;
	var encuId = encrypt.decryptNew(req.body._id);
	betHistory.findOne({_id: mongoose.mongo.ObjectId(encuId), user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, resupd){
		if(resupd){
			var payout = resupd.payout.toFixed(2);
			var next_payout = ((payout - 1) * 2) + 1;
			res.json({success:1, currData : resupd, next_payout:next_payout.toFixed(2)});
		}else{
      res.json({success:0,msg:"somthing wents wrong !"});
		}
	})
})

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	/*gamelist.findOne({game_name:'mines'}).exec(function(err1, res1){
    if(res1){
       	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
    } else {res.json({success:0});}
	})*/
	gamelist.findOne({game_name:'mines'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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