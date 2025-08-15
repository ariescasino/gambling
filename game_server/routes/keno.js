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
const betHistory = require('../model/keno_bet_history');
const gamelist = require('../model/gamelist');
const profitDb = require('../model/profit');

router.post('/getGameResult', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	var bet_type = req.body.type;
	var bet_Numbers = req.body.betNum;
	var bet_riskLeval = req.body.risklvl;
	var bet_payouts = req.body.riskpayout;
	common.findUserBalance(userId, currency,async function(balance){
		if(balance >= bet_amount) {
			var updated_balance = balance - bet_amount;
			var balance = await common.updateUserBalance(userId, currency, updated_balance);
			userHash.findOne({user_id:userId,game:"keno"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp){
					var result = game.kenoGameResult(resp.server_seed, resp.client_seed, resp.nonce);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"keno");
					var result = game.kenoGameResult(user_has.client_seed, user_has.server_seed, user_has.nonce);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"keno"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
					getresults(bet_Numbers, result,async function(match, notmatch) {
						var pay_out = bet_payouts[match.length];
						var add_bal = parseFloat(bet_amount) * parseFloat(pay_out);
						
						if(parseFloat(add_bal) < parseFloat(bet_amount)){
							var status =  "loser";
							var profit = parseFloat(bet_amount)-parseFloat(add_bal);
						}else if(parseFloat(add_bal) > parseFloat(bet_amount)){
							var status =  "winner";
							var profit = parseFloat(add_bal)-parseFloat(bet_amount);
						}
						var update_bal = parseFloat(add_bal)+parseFloat(updated_balance);
						var balance = await common.updateUserBalance(userId, currency, update_bal);
						if(status == "loser"){
							common.findAdminBal(currency, async function(AdminBal){
								var updatAdBal = parseFloat(AdminBal)+parseFloat(profit);
								var Admbalance = await common.updateAdminBalance(currency, updatAdBal);
								/*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: currency, amount: profit, type: "keno"}
				                profitDb.create(profitJson, function(proErr, proRes) {
				                    console.log(proRes);
				                })*/
							})
						}
						var obj = {
							user_id 	 : mongoose.mongo.ObjectId(userId),
							game 		 : "keno",
							bet_type 	 : bet_type,
							bet_amount 	 : bet_amount,
							currency 	 : currency,
							payout 		 : pay_out,
							client_seed  : clientSeed,
							server_seed  : serverSeed,
							nonce 		 : nounce,
							bet_user	 : bet_Numbers,
							bet_matched	 : match,
							bet_notmatch : notmatch,
							status 		 : status,
							win_lose_amt : profit,
						};
						betHistory.create(obj, function(err, resData) {
							if(err) {
								res.json({success:0,msg:"Please try again"});
							}
							if(resData) {
								betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"keno"}).sort({_id : -1}).exec(function(err2, res2){
								 	users.updateOne({"_id":userId,"gamecount.name":"keno"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
			    						if(doc){
			    							common.wagecountUpdate(currency,userId,bet_amount,profit,status,"keno",function(data) {})
											common.gamecountUpdate(userId,"keno",status,currency,function(data) {})
											common.sendGameResult(resData);;
										 	res.json({success:1,status:obj.status ,balance : update_bal, currency: currency, history : res2, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce, bet_matched:match, bet_not_matched: notmatch, status:status, payOut: pay_out});
			    						}else{
			           						res.json({success:0,msg:"Something went wrong"});
			    						}
			    					})
								})
							}
						});
					});
				});
			});
		} else {
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	});
})

function getresults(bet, ans, callback, notmatch){
	var length = ans.length;
	var matched = [];
	var notMatched = [];
	if(length > 0) {
		var i = 1;
		ans.forEach((val) => {
			var matchedNum = bet.find(mat => mat == val);
			if(matchedNum !== undefined){
				matched.push(val);
			}else{
				notMatched.push(val);
			}
		 	if(i == length) {callback(matched, notMatched);}
            i = i+1;
		})
	}else{
		callback(matched, notMatched);
	}
}

router.post('/updateUserHash', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var client_seed = req.body.client_seed;
	var server_seed = req.body.server_seed;
	var nonce 		= req.body.nonce;
	var new_client_seed = common.randomString(15);
	var new_server_seed = common.randomString(32);
	userHash.updateOne({user_id:userId, game:"keno"}, {"$set": {client_seed:client_seed,server_seed:server_seed,nonce:nonce,new_client_seed:new_client_seed,new_server_seed:new_server_seed}}).exec(function(err, resp){
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
	userHash.findOne({user_id:userId,game:"keno"}).exec(function(err, resp){
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
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"keno"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({game:"keno"}).sort({_id : -1}).sort({_id : -1}).limit(50).exec(function(err1, res1){
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

    userHash.findOne({user_id:userId,game:"keno"}).exec(async function(err, resp) {
        if(err) { return res.json({success:0,msg:"Please try again"}); }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "keno");
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
            const nounce= parseInt(resp.nonce);
            var serverSeed1 = encrypt.withDecrypt(serverSeed);
    		var clientSeed2 = encrypt.withDecrypt(clientSeed);

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':userId},{username:1,_id:0}).exec(function(Errs,Resp) {
            	if(Errs){
					return res.json({success:0,msg:"Something wents wrong !"});	
            	}
            	if(Resp){
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,userbet:resp.bet_user,win:resp.bet_matched,loss:resp.bet_notmatch,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}
            		res.json({success:1,msg:data})
            	}
            })
		}
	})
});

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
							gamelist.updateOne({'game_name':'keno'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"keno"});	
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
							gamelist.updateOne({'game_name':'keno'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
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
							gamelist.updateOne({'game_name':'keno'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"keno"});
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
							gamelist.updateOne({'game_name':'keno'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
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

router.post('/generateHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var newCli = encrypt.withEncrypt(common.randomString(12));
    var nounce = req.body.nonce;
    var serverSeed=req.body.newserverSeed;
    var clientSeed=req.body.newclientSeed;

    userHash.findOne({user_id:userId,game:"keno"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"keno"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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
    var serverSeed = req.body.newserverSeed;
    var clientSeed = req.body.newclientSeed;
    var oldserverSeed = req.body.oldserverSeed;

    var nounce = req.body.nonce;
    var newSer = encrypt.withEncrypt(common.randomString(24));
    var newCli = encrypt.withEncrypt(common.randomString(12));
    
    userHash.findOne({user_id:userId,game:"keno"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"keno"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                    betHistory.updateMany({user_id:userId,server_seed:oldserverSeed,game:"keno"},{$set:{seed_status:1}}).exec(function(err1,resp1){
						if(err1){ return res.json({success:0,msg:"Something went wrong"});}
						if(resp1){ return res.json({success:1,msg:"Seed Changed"}) };
					})
                }
            })
        }
    })
})

router.post('/getminbetamount', common.userVerify, function(req, res) {
	var userCurr = req.body.currency;
	/*gamelist.findOne({game_name:'keno'}).exec(function(err1, res1){
        if(res1){
           	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
        } else {res.json({success:0});}
	})*/
	gamelist.findOne({game_name:'keno'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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