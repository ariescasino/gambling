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
const betHistory = require('../model/wheel_result');

const gamelist = require('../model/gamelist');
const profitDb = require('../model/profit');

router.post('/getGameResult', common.userVerify, function(req, res) {
	var userId = mongoose.mongo.ObjectId(req.userId);
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;
	var numLen = req.body.selectedNum;
	var segment = req.body.segment;
	common.findUserBalance(userId, currency, function(balance){
		if(balance >= bet_amount) {
			userHash.findOne({user_id:userId,game:"wheel"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}
				if(resp) {
					var result= game.wheelGameResult(resp.server_seed,resp.client_seed,resp.nonce,segment);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId,"wheel");
					var result= game.wheelGameResult(user_has.client_seed, user_has.server_seed,user_has.nonce,segment);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}
				userHash.updateOne({user_id:userId,game:"wheel"}, {"$set": {nonce: nounce+1}}).exec(function(err1, res1){
					// console.log(res1)
						return res.json({success:1,result:result, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce});
				}); 
			});
		} else {
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	});
})

router.post('/saveBetHistory', common.userVerify, async function(req, res){
	var bet_amount = req.body.bet_amount;
	var currency = req.body.currency;
	var risk = req.body.risk;
	var segment = req.body.segment;
	var pay_out = req.body.pay_out;
	var userId = req.userId;
	var clientSeed = req.body.clientSeed;
	var serverSeed = req.body.serverSeed;
	var nonce = req.body.nonce;
	var result = req.body.result;


	common.findUserBalance(userId, currency, async function(userBalance){ 
		if(bet_amount <= userBalance) {
			var add_bal = parseFloat(bet_amount) * parseFloat(pay_out);
			if(parseFloat(add_bal) <= parseFloat(bet_amount)) {
				var amount = parseFloat(bet_amount)-parseFloat(add_bal);
				var updated_balance = userBalance - amount;
				// console.log(updated_balance)
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
				var status = "loser";
			} else {
				var amount = parseFloat(add_bal)-parseFloat(bet_amount); 
				var updated_balance = userBalance + amount;
				var balance = await common.updateUserBalance(userId, currency, updated_balance);
				var status = "winner";
			}

			// console.log(balance)
			if(status == "loser"){
                common.findAdminBal(currency, async function(AdminBal){
                    var updatAdBal = parseFloat(AdminBal)+parseFloat(amount);
                    var Admbalance = await common.updateAdminBalance(currency, updatAdBal);
	                /*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: currency, amount: amount, type: "wheel"}
	                profitDb.create(profitJson, function(proErr, proRes) {
	                    console.log(proRes);
	                })*/
                })
            }

			var obj = {
				user_id 	 : mongoose.mongo.ObjectId(userId),
				game 		 : "wheel",
				bet_amount 	 : bet_amount,
				risk		 : risk,
				segment		 : segment,
				currency 	 : currency,
				payout 		 : pay_out,
				result	     : result,
				status 		 : status,
				win_lose_amt : amount,
				client_seed  : clientSeed,
				server_seed  : serverSeed,
				nonce 		 : nonce
			};

			betHistory.create(obj, function(err, resData) {
				if(err) {
					res.json({success:0,msg:"Please try again"});
				}

				if(resData) {
					betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"wheel"}).sort({_id : -1}).exec(function(err1, res1){
						users.updateOne({"_id":userId,"gamecount.name":"wheel"},{$inc:
    					{"gamecount.$.total_count":1}},(ers,doc)=>{
    						if(doc){
    							common.wagecountUpdate(currency,userId,bet_amount,resData.win_lose_amt,status,"wheel",function(data) {})
    							common.sendGameResult(resData);
    							common.gamecountUpdate(userId,"wheel",status,currency,function(data) {})
    							res.json({success:1,status:obj.status,balance : updated_balance, currency: currency, history : res1,payOut:obj.payout});
    						}else{
           						res.json({success:0,msg:"Something went wrong"});
    						}
    					})
					})
				}
			});
		} else {
           	res.json({success:0,msg:"You are looser."});
        }
	});
});

router.post('/getHash',common.userVerify, function (req, res) {
    var userId = req.userId;

    userHash.findOne({user_id:userId,game:"wheel"}).exec(async function(err, resp) {
        if(err) { return res.json({success:0,msg:"Please try again"}); }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "wheel");
        	res.json({success:1, serverSeed:user_has.server_seed, clientSeed:user_has.client_seed, nounce:user_has.nonce, newSer:user_has.new_server_seed, newCli:user_has.new_client_seed});
        }  
    })
})

router.post('/generateHash',common.userVerify, function (req, res) {
    var userId = req.userId;
    var newCli = encrypt.withEncrypt(common.randomString(12));
    var nounce = req.body.nonce;
    var serverSeed=req.body.newserverSeed;
    var clientSeed=req.body.newclientSeed;

    userHash.findOne({user_id:userId,game:"wheel"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"wheel"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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
    
    userHash.findOne({user_id:userId,game:"wheel"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"wheel"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                    betHistory.updateMany({user_id:userId,server_seed:oldserverSeed,game:"wheel"},{$set:{seed_status:1}}).exec(function(err1,resp1){
						if(err1){ return res.json({success:0,msg:"Something went wrong"});}
						if(resp1){ return res.json({success:1,msg:"Seed Changed"}) };
					})
                }
            })
        }
    })
})

// router.post('/updateUserHash', common.userVerify, function(req, res) {
// 	var userId = mongoose.mongo.ObjectId(req.userId);
// 	var client_seed = req.body.client_seed;
// 	var server_seed = req.body.server_seed;
// 	var nonce 		= req.body.nonce;
// 	var new_client_seed = common.randomString(15);
// 	var new_server_seed = common.randomString(32);
// 	userHash.updateOne({user_id:userId, game:"keno"}, {"$set": {client_seed:client_seed,server_seed:server_seed,nonce:nonce,new_client_seed:new_client_seed,new_server_seed:new_server_seed}}).exec(function(err, resp){
// 		if(resp) {
// 			return res.json({success:1,new_server_seed:new_server_seed, new_client_seed:new_client_seed});
// 		}

// 		if(err) {
// 			return res.json({success:0,msg:"Please try again"});
// 		}
// 	})
// });				

// router.post('/getUserHash', common.userVerify, function(req, res){
// 	var userId = mongoose.mongo.ObjectId(req.userId);
// 	userHash.findOne({user_id:userId,game:"keno"}).exec(function(err, resp){
// 		if(err) {
// 			return res.json({success:0,msg:"Please try again."});
// 		}

// 		if(resp) {
// 			return res.json({success:1, result:resp});
// 		}
// 	});
// });

router.post('/getBetHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"wheel"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});

router.post('/getAllBetHistory', function (req, res) {
    betHistory.find({game:"wheel"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
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
            		var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"result":resp.bet_result,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status,"risk":resp.risk,"segment":resp.segment,'seedstatus':resp.seed_status,"server":serverSeed1,"client":clientSeed2}

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
							gamelist.updateOne({'game_name':'wheel'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Favourites",game:"wheel"});	
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
							gamelist.updateOne({'game_name':'wheel'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
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
							gamelist.updateOne({'game_name':'wheel'},{$inc:{'like_count':1}}).exec(function(Err,Res){
								if(Err){
									return res.json({success:0,msg:"Something went wrong"});	
								}
								if(Res){
									return res.json({success:1,msg:"Added to Liked",game:"wheel"});	
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
							gamelist.updateOne({'game_name':'wheel'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
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
	/*gamelist.findOne({game_name:'wheel'}).exec(function(err1, res1){
        if(res1){
           	res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
        } else {res.json({success:0});}
	})*/
	gamelist.findOne({game_name:'wheel'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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