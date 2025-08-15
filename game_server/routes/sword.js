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
const game = require('../helpers/game');

//schemas
const users = require('../model/users');
const logs = require('../model/user_history');
const currency = require('../model/currency');
const wallet = require('../model/userWallet');
const userHash = require('../model/user_hash');
const betHistory = require('../model/sword_bethistory');
const gamelist = require('../model/gamelist');
const crypto = require('crypto');
const profitDb = require('../model/profit');

router.post('/getGameResult', common.tokenMiddleware, function(req, res) {
	var userId = req.userId;
	var currency = req.body.currency;
	var bet_amount = req.body.bet_amount;var round =req.body.round;
    var imagesPayout = [15,10,8,7,5,2,1,0.5,0.5,0.3,0.3];

	common.findUserBalance(userId, currency, async function(balance){
		if(balance >= bet_amount) {
            var updated_balance = balance - bet_amount;
            var balance = await common.updateUserBalance(userId, currency, updated_balance);
			userHash.findOne({user_id:userId,game:"sword"}).exec(async function(err, resp) {
				if(err) {
					return res.json({success:0,msg:"Please try again"});
				}	
				if(resp) {
					var result = game.swordResult(resp.server_seed, resp.client_seed, resp.nonce,round);
					var nounce= parseInt(resp.nonce);
					var serverSeed = resp.server_seed;
				    var clientSeed  = resp.client_seed;
				} else {
					var user_has = await game.generateUserHash(userId, "sword");
					var result = game.swordResult(user_has.client_seed, user_has.server_seed, user_has.nonce,round);
					var serverSeed = user_has.server_seed;
					var clientSeed = user_has.client_seed;
					var nounce 	   = parseInt(user_has.nonce); 
				}

				userHash.updateOne({user_id:userId,game:"sword"},{"$set": {nonce: nounce+1}}).exec(async function(err1, res1){
					var valreslt = [];
                    var catspinval = result.catspin;
                    var payout = 0;
                    valreslt.push(result.swordResult[0]);
                    valreslt.push(result.swordResult[1]);
                    valreslt.push(result.swordResult[2]);
                    valreslt.push(result.swordResult[3]);
                    valreslt.push(result.swordResult[4]);
                    if(catspinval[0] !== null){valreslt[1] = catspinval[0]}
                    if(catspinval[1] !== null){valreslt[2] = catspinval[1]}
                    if(catspinval[2] !== null){valreslt[3] = catspinval[2]}
                    if(imagesPayout[valreslt[0]] !== undefined ){
                        payout += imagesPayout[valreslt[0]];
                    }
                    if(imagesPayout[valreslt[1]] !== undefined ){
                        payout += imagesPayout[valreslt[1]];
                    }
                    if(imagesPayout[valreslt[2]] !== undefined ){
                        payout += imagesPayout[valreslt[2]];
                    }
                    if(imagesPayout[valreslt[3]] !== undefined ){
                        payout += imagesPayout[valreslt[3]];
                    }
                    if(imagesPayout[valreslt[4]] !== undefined ){
                        payout += imagesPayout[valreslt[4]];
                    }
                    if((valreslt[1] == 16 || catspinval[0] == 11) && (valreslt[2] == 16 || catspinval[1] == 11) && (valreslt[3] == 16 || catspinval[2] == 11)){
                        if(result.sword == 20 || result.sword == 30 || result.sword == 50 || result.sword == 100){
                            var pay_out = parseFloat(payout)+parseFloat(result.sword);
                            var winpayout = parseFloat(pay_out);
                            var add_bal = parseFloat(bet_amount) * parseFloat(winpayout);
                            if(parseFloat(add_bal) < parseFloat(bet_amount)){
                                var status =  "loser";
                                var profit = parseFloat(bet_amount)-parseFloat(add_bal);
                            }else if(parseFloat(add_bal) > parseFloat(bet_amount)){
                                var status =  "winner";
                                var profit = parseFloat(add_bal)-parseFloat(bet_amount);
                            }
                        }else{
                            var add_bal = parseFloat(bet_amount) * parseFloat(payout);
                            var status = 'pending';
                            var pay_out = payout;
                            var profit = 0;
                        }
                    }else{
                        var pay_out = payout;
                        var add_bal = parseFloat(bet_amount) * parseFloat(pay_out);
                        if(parseFloat(add_bal) < parseFloat(bet_amount)){
                            var status =  "loser";
                            var profit = parseFloat(bet_amount)-parseFloat(add_bal);
                        }else if(parseFloat(add_bal) > parseFloat(bet_amount)){
                            var status =  "winner";
                            var profit = parseFloat(add_bal)-parseFloat(bet_amount);
                        }
                    }
                    var update_bal = parseFloat(add_bal)+parseFloat(updated_balance);
                    var balance = await common.updateUserBalance(userId, currency, update_bal);
                    if(status == "loser"){
                        common.findAdminBal(currency, async function(AdminBal){
                            var updatAdBal = parseFloat(AdminBal)+parseFloat(profit);
                            var Admbalance = await common.updateAdminBalance(currency, updatAdBal);
                            /*let profitJson = {user_id: mongoose.mongo.ObjectId(userId), currency: currency, amount: profit, type: "sword"}
                            profitDb.create(profitJson, function(proErr, proRes) {
                                console.log(proRes);
                            })*/
                        })
                    }
                    var catspinData = [];
                    if(result.catspin[0] !== null){catspinData.push({1:result.catspin[0]})};
                    if(result.catspin[1] !== null){catspinData.push({2:result.catspin[1]})};
                    if(result.catspin[2] !== null){catspinData.push({3:result.catspin[2]})};
                    var obj = {
                        user_id         : mongoose.mongo.ObjectId(userId),
                        game            : "sword",
                        bet_amount      : bet_amount,
                        currency        : currency,
                        payout          : pay_out,
                        client_seed     : clientSeed,
                        server_seed     : serverSeed,
                        nonce           : nounce,
                        status          : status,
                        win_lose_amt    : profit,
                        game_result     : result.swordResult,
                        spin_result     : result.sword,
                        catspin_result  : catspinData,
                    };
                    betHistory.create(obj, function(err, resData) {
                        if(err) {res.json({success:0,msg:"Please try again"});}
                        if(resData) {
                            var encuId = encrypt.encryptNew(resData._id.toString());
                            betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"sword"}).sort({_id : -1}).exec(function(err2, res2){
                                users.updateOne({"_id":userId,"gamecount.name":"sword"},{$inc:{"gamecount.$.total_count":1}},(ers,doc)=>{
                                    if(doc){

                                        if(status !=='pending'){
                                            common.wagecountUpdate(currency,userId,bet_amount,profit,status,"sword",function(data) {});
                                            common.gamecountUpdate(userId,"sword",status,currency,function(data) {});
                                            common.sendGameResult(resData);
                                        }
                                        return res.json({success:1,result:result, serverSeed:serverSeed,clientSeed:clientSeed,nonce:nounce, history : res2, payOut: pay_out, userId:encuId,profit:profit,amt:bet_amount, status:status});
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
			return res.json({success:0, msg:"Insufficient Balance"});
		}
	});
});

router.post('/bonusSpin',common.tokenMiddleware, function(req, res) {
	var userId = req.userId;
	var round=req.body.round;var positions=req.body.positions;
    var PenId = req.body.userpendId;
    var encuId = encrypt.decryptNew(PenId);
    var imagesPayout = [15,10,8,7,5,2,1,0.5,0.5,0.3,0.3];
    var payout=0;
    betHistory.findOne({_id:mongoose.mongo.ObjectId(encuId)}).exec(function(hiserr, hisData){
        if(hisData){
            userHash.findOne({user_id:mongoose.mongo.ObjectId(userId),game:"sword"}).exec(function(err,resData) {
        		var result=game.AfterswordResult(resData.server_seed, resData.client_seed, resData.nonce,round,positions);
        		var repeat = [11, 12, 13, 14];
                var payoutVal = hisData.respin;
                var i = 1;var len = result.length;
                result.forEach((value) => {
                    if(value !== undefined && value !== null){
                        var respinData = repeat.filter(val => val == value);
                        if(respinData.length == 0){ payoutVal.push(value);}
                    }
                    if(len == i){
                        if(payoutVal.length == 5){
                            if(parseFloat(imagesPayout[payoutVal[0]]) !== NaN ){
                                payout += parseFloat(imagesPayout[payoutVal[0]]);
                            }
                            if(parseFloat(imagesPayout[payoutVal[1]]) !== NaN){
                                payout += parseFloat(imagesPayout[payoutVal[1]]);
                            }
                            if(parseFloat(imagesPayout[payoutVal[2]]) !== NaN ){
                                payout += parseFloat(imagesPayout[payoutVal[2]]);
                            }
                            if(parseFloat(imagesPayout[payoutVal[3]]) !== NaN ){
                                payout += parseFloat(imagesPayout[payoutVal[3]]);
                            }
                            if(parseFloat(imagesPayout[payoutVal[4]]) !== NaN ){
                                payout += parseFloat(imagesPayout[payoutVal[4]]);
                            }
                            payout = payout.toFixed(2);
                            var pay_out = parseFloat(payout)*parseFloat(hisData.spin_result);
                            pay_out = pay_out+hisData.payout;
                            var add_bal = parseFloat(hisData.bet_amount) * parseFloat(pay_out);
                            if(parseFloat(add_bal) < parseFloat(hisData.bet_amount)){
                                var status =  "loser";
                                var profit = parseFloat(hisData.bet_amount)-parseFloat(add_bal);
                            }else if(parseFloat(add_bal) > parseFloat(hisData.bet_amount)){
                                var status =  "winner";
                                var profit = parseFloat(add_bal)-parseFloat(hisData.bet_amount);
                            }
                        }else{
                            var status = "pending";
                            var pay_out = hisData.payout;
                            var profit = hisData.win_lose_amt;
                        }
                        let obj = {
                            respin:payoutVal, 
                            status:status,
                            win_lose_amt:profit,
                            payout:pay_out,
                        }
                        betHistory.updateOne({_id:mongoose.mongo.ObjectId(encuId), status:"pending"},{"$set":obj},(ers,doc)=>{
                            betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"sword"}).sort({_id : -1}).exec(function(err2, res2){
                                if(status !=='pending'){
                                    betHistory.findOne({_id:mongoose.mongo.ObjectId(encuId)},(beters,betdoc)=>{
                                        common.wagecountUpdate(currency,userId,bet_amount,profit,status,"sword",function(data) {});
                                        common.gamecountUpdate(userId,"sword",status,currency,function(data) {});
                                        common.sendGameResult(betdoc);
                                    });
                                }
                                return res.json({success:1, history : res2, payOut: pay_out,profit:profit, msg:result, amt:hisData.bet_amount,status:status});
                            })
                        })
                    }
                    i = i+1;
                })
        	})
        }else{
            res.json({success:0, msh: "Something wents wrong !"});
        }
    })
})

router.post('/getBetHistory', common.userVerify, function(req, res){
	var userId = req.userId;
	betHistory.find({user_id:mongoose.mongo.ObjectId(userId),game:"sword"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
		res.json({success:1, history : res1});
	})
});


router.post('/getAllBetHistory', function (req, res) {

    betHistory.find({game:"sword"}).sort({_id : -1}).limit(50).exec(function(err1, res1){
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
            return res.json({success:1,msg:[]});
        }
    })
});
	


router.post('/getHash',common.userVerify, function (req, res) {
    var userId = req.userId;

    userHash.findOne({user_id:userId,game:"sword"}).exec(async function(err, resp) {
        if(err) { return res.json({success:0,msg:"Please try again"}); }   

        if(resp){
            res.json({success:1, serverSeed:resp.server_seed, clientSeed:resp.client_seed, nounce:resp.nonce, newSer:resp.new_server_seed, newCli:resp.new_client_seed});
        } else {
        	var user_has = await game.generateUserHash(userId, "sword");
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

    userHash.findOne({user_id:userId,game:"sword"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"sword"},{"$set":{new_client_seed:newCli}}).exec(function(errs,resData) { 
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
    var nounce = req.body.nonce;
    var newSer = encrypt.withEncrypt(common.randomString(24));
    var newCli = encrypt.withEncrypt(common.randomString(12));
    
    userHash.findOne({user_id:userId,game:"sword"}).exec(function(err, resp) {
        if(err) {
            return res.json({success:0,msg:"Please try again"});
        }   
        if(resp){
            userHash.updateOne({user_id:userId,game:"sword"},{"$set":{client_seed:clientSeed, server_seed:serverSeed, nonce:nounce, new_server_seed:newSer, new_client_seed:newCli}}).exec(function(errs,resData) {
                if(errs){
                    return res.json({success:0,msg:"Something went wrong"});
                }
                if(resData){
                    res.json({success:1,msg:"Seed Changed"})
                }
            })
        }
    })
})

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
                            gamelist.updateOne({'game_name':'sword'},{$inc:{'fav_count':1}}).exec(function(Err,Res){
                                if(Err){
                                    return res.json({success:0,msg:"Something went wrong"});    
                                }
                                if(Res){
                                    return res.json({success:1,msg:"Added to Favourites",game:"sword"}); 
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
                            gamelist.updateOne({'game_name':'sword'},{$inc:{'fav_count':-1}}).exec(function(Err,Res){
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
                            gamelist.updateOne({'game_name':'sword'},{$inc:{'like_count':1}}).exec(function(Err,Res){
                                if(Err){
                                    return res.json({success:0,msg:"Something went wrong"});    
                                }
                                if(Res){
                                    return res.json({success:1,msg:"Added to Liked",game:"sword"});  
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
                            gamelist.updateOne({'game_name':'sword'},{$inc:{'like_count':-1}}).exec(function(Err,Res){
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

            var hmacWA = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
            let val=hmacWA.toString();

            var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nounce, serverSeed);
            var fss=hmacDirectWA.toString();

            users.findOne({'_id':userId},{username:1,_id:0}).exec(function(Errs,Resp) {
                if(Errs){
                    return res.json({success:0,msg:"Something went wrong !"}); 
                }
                if(Resp){
                    var data={"bet_id":resp._id,"username":Resp.username,"created_at":resp.created_at,"bet_amount":resp.bet_amount,"payout":resp.payout,"pro_amt":resp.win_lose_amt,"serverSeed":val,"clientSeed":fss,"nounce":nounce,"status":resp.status}
                    res.json({success:1,msg:data})
                }
            })
        }
    })
});

router.post('/getminbetamount', common.userVerify, function(req, res) {
    var userCurr = req.body.currency;
    /*gamelist.findOne({game_name:'sword'}).exec(function(err1, res1){
        if(res1){
            res.json({success:1,min_bet:res1.min_bet, max_bet:res1.max_bet});
        } else {
                res.json({success:0});
        }
    })*/
    gamelist.findOne({game_name:'sword'}, {Curr:{$elemMatch:{currency:userCurr}}}).exec(function(err,resData){
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
