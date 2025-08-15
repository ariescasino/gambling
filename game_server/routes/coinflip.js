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
const endecrypt = require('../helpers/encrypt');

//schemas
const users = require('../model/users');
const logs = require('../model/user_history');
const currency = require('../model/currency');
const wallet = require('../model/userWallet');
const userHash = require('../model/user_hash');
const betHistory = require('../model/coinflip_bethis');
const gamelist = require('../model/gamelist');
const profitDb = require('../model/profit');


router.post('/getGameResult', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	common.findUserBalance(userId, currency, async function(balance){
		if(balance >= bet_amount) {
			if(req.body.userId == undefined || req.body.userId == "" || req.body.userId == null){
				var updated_balance = balance - bet_amount;
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
			}
			userHash.findOne({user_id:userId,game:"coinflip"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp) {
					var result = game.coinflipGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "coinflip");
					var result = game.coinflipGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"coinflip"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
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
			userHash.findOne({user_id:userId,game:"coinflip"}).exec(async function(err, resp) {
				if(resp){
					var result = game.kenoGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"coinflip");
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

				if(winning_status == "loser"){
					common.findAdminBal(currency, async function(AdminBal){
						var updatAdBal = parseFloat(AdminBal)+parseFloat(profit);
						var Admbalance = await common.updateAdminBalance(currency, updatAdBal);
						/*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: currency, amount: profit, type: "coinflip"}
		                profitDb.create(profitJson, function(proErr, proRes) {
		                    console.log(proRes);
		                })*/
					})
				}
				var obj = {
					user_id 	 : mongoose.mongo.ObjectId(userId),
					bet_amount 	 : bet_amount,
					currency 	 : currency,
					payout 		 : pay_out,
					bet_result	 : bet_result,
					status 		 : winning_status,
					win_lose_amt : profit,
					game 		 : "coinflip",
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
									betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}}).sort({_id : -1}).exec(function(err1, res1){
								 		users.updateOne({"_id":userId,"gamecount.name":"coinflip"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
										 	common.wagecountUpdate(currency,userId,bet_amount,profit,winning_status,"coinflip",function(data) {})
											common.gamecountUpdate(userId,"coinflip",winning_status,currency,function(data1) {});
											if(winning_status !== 'pending'){
												betHistory.findOne({_id:mongoose.mongo.ObjectId(encuId)}).exec(async function(beterr, betresp){
													common.sendGameResult(betresp);
												});
											}
										 	res.json({success:1, balance : updated_balance, currency: currency, history : res1, userId:userclientId, coinData: obj, status:winning_status});
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
							betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}, game:"coinflip"}).sort({_id : -1}).exec(function(err1, res1){
							 	users.updateOne({"_id":userId,"gamecount.name":"coinflip"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
		    						if(doc){
		    							common.wagecountUpdate(currency,userId,bet_amount,profit,winning_status,"coinflip",function(data) {})
										common.gamecountUpdate(userId,"coinflip",winning_status,currency,function(data1) {});
										if(winning_status !== 'pending'){common.sendGameResult(resData);}
									 	res.json({success:1, balance : updated_balance, currency: currency, history : res1, userId:encuId, coinData: resData, status:winning_status});
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

router.post('/getcurt', common.userVerify, function(req, res){
	var userId = req.userId;
	var encuId = encrypt.decryptNew(req.body._id);
	betHistory.findOne({_id: mongoose.mongo.ObjectId(encuId), user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, resupd){
		if(resupd){
			res.json({success:1, currData : resupd});
		}else{
           	res.json({success:0,msg:"somthing wents wrong !"});
		}
	})
})

router.post('/getBetHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId), status:{$ne:"pending"}}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({status:{$ne:"pending"}}).sort({_id : -1}).limit(50).exec(function(err1, res1){
        if(res1.length !==0 ){
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

router.post('/getAllBetHis', function (req, res) {
    betHistory.find({status:{$ne:"pending"}}).sort({_id : -1}).limit(50).exec(function(err1, res1){
        if(res1.length !== 0 ){
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

router.post('/getGameResult', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	common.findUserBalance(userId, currency, async function(balance){
		if(balance >= bet_amount) {
			if(req.body.userId == undefined || req.body.userId == "" || req.body.userId == null){
				var updated_balance = balance - bet_amount;
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
			}
			userHash.findOne({user_id:userId,game:"coinflip"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp) {
					var result = game.coinflipGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "coinflip");
					var result = game.coinflipGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"coinflip"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
					return res.json({success:1,result:result, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce});
				});	
			});
			
		} else {
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	});
});

router.post('/getHash',common.userVerify, function (req, res) {
    // var userId = req.userId;
    // userHash.findOne({user_id:userId,game:"coinflip"}).exec(async function(err, resp) {
    //     if(err) {
    //         return res.json({success:0,msg:"Please try again"});
    //     }   
    //     if(resp){
    //         const serverSeed = resp.server_seed;
    //         const clientSeed  = resp.client_seed;
    //         const newserverSeed=resp.new_server_seed;
    //         const newclientSeed=resp.new_client_seed;
    //         var nounce= parseInt(resp.nonce);
    //         var newnounce=parseInt(0);
    //         var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    //         let val=hmacWA.toString();
    //         var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
    //         var fss=hmacDirectWA.toString();
    //         var newhmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(newserverSeed));
    //         let newval=newhmacWA.toString();
    //         var newhmacDirectWA = CryptoJS.HmacSHA256(newclientSeed + ':' + newnounce, newserverSeed);
    //         var newfss=newhmacDirectWA.toString();
    //         res.json({success:1,serverSeed:val,clientSeed:fss,nounce:nounce,newSer:newval,newCli:newfss})
    //     }else{
    //     	var user_has = await game.generateUserHash(userId, "coinflip");
    //     	res.json({success:1, serverSeed:user_has.server_seed, clientSeed:user_has.client_seed, nounce:user_has.nonce, newSer:user_has.new_server_seed, newCli:user_has.new_client_seed});
    //     }
    // })
    var userId = req.userId;

    userHash.findOne({user_id:userId,game:"coinflip"}).exec(async function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "coinflip");
        	res.json({success:1, serverSeed:user_has.server_seed, clientSeed:user_has.client_seed, nounce:user_has.nonce, newSer:user_has.new_server_seed, newCli:user_has.new_client_seed});
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
            var serverSeed1 = encrypt.withDecrypt(serverSeed);
    		var clientSeed2 = encrypt.withDecrypt(clientSeed);

            const nounce= parseInt(resp.nonce);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':userId},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,msg:"Something wents wrong !"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}
            		res.json({success:1,msg:data})
            	}
            })
		}else{
    		res.json({success:0,msg:"somthings wents wrong !"})
		}
	})
})


router.post('/generateHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var newCli = encrypt.withEncrypt(common.randomString(12));
    var nounce = req.body.nonce;
    var serverSeed=req.body.newserverSeed;
    var clientSeed=req.body.newclientSeed;
    userHash.findOne({user_id:userId,game:"coinflip"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"coinflip"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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

router.post('/changeHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var serverSeed    = req.body.newserverSeed;
    var clientSeed    = req.body.newclientSeed;
    var oldserverSeed = req.body.oldserverSeed;

    var nounce = req.body.nonce;
    var newSer = encrypt.withEncrypt(common.randomString(24));
    var newCli = encrypt.withEncrypt(common.randomString(12));
    
    userHash.findOne({user_id:userId,game:"coinflip"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"coinflip"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                	betHistory.updateMany({user_id:userId,server_seed:oldserverSeed}
                	,{$set:{seed_status:1}}).exec(function(err1,resp1){
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

router.post('/userFav',common.userVerify, function (req, res) {
	var userId = req.userId;var storeData;
	var game=req.body.name;let count ;var deleted;
	users.findOne({'_id':userId}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something wents wrong !"});	
		}
		if(resp){
			const favoriteItem = resp.user_favourites.find(item => item === game);
			var storeData=resp.user_favourites;

			if (favoriteItem==undefined) {
				storeData.push(game)
			  	users.updateOne({'_id':userId},{'user_favourites':storeData}).exec(function(errs,resData){
					if(errs){
						return res.json({success:0,msg:"Please try again"});	
					}
					if(resData){
						gamelist.findOne({'game_name':game}).exec(function(errs,resps){
							if(resps){
								gamelist.updateOne({'game_name':game},{$inc:{'fav_count':1}}).exec(function(Err,Res){
									if(Err){
										return res.json({success:0,msg:"Something went wrong"});	
									}
									if(Res){
										return res.json({success:1,msg:"Added to favourites",game:"coinflip"});	
									}
								})
							}
						})
					}
				})
			} else {
				if (storeData.includes(game)) {
				  storeData = storeData.filter(num => num !== game);
				}
			  	users.updateOne({'_id':userId},{'user_favourites':storeData}).exec(function(errs,resData){
					if(errs){
						return res.json({success:0,msg:"Please try again"});	
					}
					if(resData){
						gamelist.findOne({'game_name':game}).exec(function(errs,resps){
							if(resps){
								gamelist.updateOne({'game_name':game},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
									if(Err){
										return res.json({success:0,msg:"Something went wrong"});	
									}
									if(Res){
										return res.json({success:1,msg:"Removed from favourites games",game:""});
									}
								})
							}
						})
					}
				})
			}
		}
	})
})

router.post('/userLiked',common.userVerify, function (req, res) {
	var userId = req.userId;var storeData;
	var game=req.body.name;let count ;var deleted;
	users.findOne({'_id':userId}).exec(function(err,resp){
		if(err){
			return res.json({success:0,msg:"Something wents wrong !"});	
		}
		if(resp){
			const favoriteItem = resp.liked_game.find(item => item === game);
			var storeData=resp.liked_game;

			if (favoriteItem==undefined) {
				storeData.push(game)
			  	users.updateOne({'_id':userId},{'liked_game':storeData}).exec(function(errs,resData){
					if(errs){
						return res.json({success:0,msg:"Please try again"});	
					}
					if(resData){
						gamelist.findOne({'game_name':game}).exec(function(errs,resps){
							if(resps){
								gamelist.updateOne({'game_name':game},{$inc:{'like_count':+1}}).exec(function(Err,Res){
									if(Err){
										return res.json({success:0,msg:"Something went wrong"});	
									}
									if(Res){
										return res.json({success:1,msg:"Added to Liked",game:"coinflip"})
									}
								})
							}
						})
					}
				})
			} else {
				if (storeData.includes(game)) {
				  storeData = storeData.filter(num => num !== game);
				}
			  	users.updateOne({'_id':userId},{'liked_game':storeData}).exec(function(errs,resData){
					if(errs){
						return res.json({success:0,msg:"Please try again"});	
					}
					if(resData){
						gamelist.findOne({'game_name':game}).exec(function(errs,resps){
							if(resps){
								gamelist.updateOne({'game_name':game},{$inc:{'like_count':-1}}).exec(function(Err,Res){
									if(Err){
										return res.json({success:0,msg:"Something went wrong"});	
									}
									if(Res){
										return res.json({success:1,msg:"Removed from liked games",game:""});	
									}
								})
							}
						})
					}
				})
			}
		}
	})
})

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	gamelist.findOne({game_name:'coinflip'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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