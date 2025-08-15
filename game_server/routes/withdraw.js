const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const async  = require('async');

const moment = require('moment');
const validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');
const multer = require('multer');
const Web3 = require('web3');

//helpers
const encrypt = require('../helpers/encrypt');
const common = require('../helpers/common');
const mail = require('../helpers/mail');
const cloudinary = require('../helpers/cloudinary');
const game = require('../helpers/game');

//schemas
const users = require('../model/users');
const wallet = require('../model/userWallet');
const currency = require('../model/currency');
const withdraw = require('../model/withdraw');
const user_address = require('../model/userAddress');


router.post('/withdrawprocess',common.userVerify, function(req, res){
	var userId = req.userId;
	var info = req.body;
	/*let withd = validator.isEmpty(info.address_info);
	let withAmt = validator.isEmpty(info.amount);*/
	let amt=parseInt(info.amount);

	// if(!withd && !withAmt){
		currency.findOne({currency: info.currency},{_id:0,currency:1, withdraw_fee:1, min_withdraw:1, max_withdraw:1}).exec(function(currErr, currData){
			if(currData){
				users.findOne({_id:mongoose.mongo.ObjectId(userId)},{_id:0,luck_value:1, added_value:1, username:1,tfa_status:1}).exec(function(userErr, userData){
					if(userData){
						if(userData.tfa_status == 1){
							// if(userData.with_status == 1){
							// 	encrypt.comparePswd(info.withpass, userData.with_pass, function(passData){
							// 		if(passData){
										wallet.findOne({user_id:mongoose.Types.ObjectId(userId)}, {wallet:{$elemMatch:{currency:currData.currency}}, _id:0}).exec(function(walErr, walData){
											if(walData){
												var Waltamt = walData.wallet[0].amount;
												if(parseFloat(info.amount) <= Waltamt){
													if((parseFloat(info.amount) > (parseFloat(currData.min_withdraw)))){
														if((parseFloat(info.amount) < (parseFloat(currData.max_withdraw)))){
															var BalWith = (parseFloat(Waltamt) - parseFloat(info.amount));
															var fee = (parseFloat(amt)*parseFloat(currData.withdraw_fee))/100;
															var totalVal = parseFloat(info.amount)-fee;
															const obj = {
																user_id  : mongoose.mongo.ObjectId(userId),
																currency : currData.currency,
																amount   : info.amount,
																transfer_amount : totalVal,
																address_info : info.address_info,
																fee_amt : fee,
																network: info.network,
																currency_type:info.currency_type,
																status  : 'process',
																CIdKey  : common.randomString(4)+ new Date().getTime()+common.randomString(4)+common.randomString(4),
															}
															wallet.updateOne({user_id:mongoose.Types.ObjectId(userId), "wallet.currency":currData.currency},{"$set":{"wallet.$.amount": BalWith}}, {multi:true}).exec(function(waltErr,waltRes){
																if(waltRes){
																	withdraw.create(obj, function(err,result) {
																		if(result){
																			var usermail = encrypt.decryptNew(userData.luck_value)+ encrypt.decryptNew(userData.added_value);
																			var userId = userId;
																			var encuId = encrypt.encrypt_with(result.CIdKey);
																			var confirm = encrypt.encrypt_with("confirm");
																			var reject = encrypt.encrypt_with("reject");
																			var ConfirmURI = common.getUrl()+'activate_withdraw?token='+encodeURIComponent(encuId)+'&verify='+encodeURIComponent(confirm);
																			var RejectURI = common.getUrl()+'activate_withdraw?token='+encodeURIComponent(encuId)+'&verify='+encodeURIComponent(reject);

																			var specialVars = { '###LINK###': ConfirmURI, '###USER###': userData.username, '###LINK1###': RejectURI, '###AMOUNT###': result.transfer_amount, '###CURRENCY###': result.currency };
																			mail.sendMail(usermail, 'user_withdraw', specialVars, function(mailRes) {
																				res.json({success:1, msg:'Withdraw confirmation link sent to your email'});
																			});
																		}
																	})
																}else{
																	return res.json({success:0, msg: "Failed to withdraw !"});
																}
															})
														}else{
															return res.json({success:0, msg: "Enter the amount within the Maximum amount !"});
														}
													}else{
														return res.json({success:0, msg: "Enter the amount within the Miniimum amount !"});
													}
												}else{
													return res.json({success:0, msg: "Insafficient Balance"});
												}
											}else{
												return res.json({success:0, msg: "wallet is not defined !"});
											}
										})
								// 	}else{
								// 		return res.json({success:0, msg: "Wrong Withdraw Password !"});
								// 	}
								// })
							// }else{
							// 	return res.json({success:2, msg: "User must Enable withdraw password !"});
							// }
						}else{
							return res.json({success:2, msg: "Please Enable 2FA !"});
						}
					}else{
						return res.json({success:0, msg: "user is undefined !"});
					}
				})
			}else{
				return res.json({success:0, msg: "currency is not defined !"});
			}
		})
	/*}else{
		return res.json({success:0, msg: "Please enter all details"});
	}*/
})

router.post('/activatewithdraw', function(req, res){
	var info = req.body;
	var TokId=encrypt.decrypt_with(decodeURIComponent(info.token));
	var varifyId=encrypt.decrypt_with(decodeURIComponent(info.verify));
	withdraw.findOne({status:'process', CIdKey:TokId}).exec(function(witherr, withdata){
		if(withdata){
			users.findOne({_id:mongoose.mongo.ObjectId(withdata.user_id)},{_id:0,username:1}).exec(function(usererr, userData){
				if(varifyId == "confirm"){
					withdraw.updateOne({CIdKey:TokId},{"$set": {status: 'pending'}}).exec(function(err, resData){
						var usermail = "vasanthkumar@hivelance.com";
						var encuId = encrypt.encrypt_with(TokId);
						var confirm = encrypt.encrypt_with("confirm");
						var reject = encrypt.encrypt_with("reject");
						var ConfirmURI = common.getUrl()+'activate_withdraw?token='+encodeURIComponent(encuId)+'&verify='+encodeURIComponent(confirm);
						var RejectURI = common.getUrl()+'activate_withdraw?token='+encodeURIComponent(encuId)+'&verify='+encodeURIComponent(reject);

						var specialVars = { '###LINK###': ConfirmURI, '###USER###': userData.username, '###LINK1###': RejectURI, '###AMOUNT###': withdata.transfer_amount, '###CURRENCY###': withdata.currency };
						/*console.log(ConfirmURI);
						console.log(RejectURI);*/
						// mail.sendMail(usermail, 'admin_withdraw', specialVars, function(mailRes) {});

						return res.json({success:1, msg: "Succesfully Withdraw request send to Admin !"});
					})
				}else if(varifyId == "reject"){
					wallet.findOne({user_id:mongoose.Types.ObjectId(withdata.user_id)}, {wallet:{$elemMatch:{currency:withdata.currency}}, _id:0}).exec(function(walErr, walData){
						if(walData){
							var Waltamt = walData.wallet[0].amount;
							var BalWith = parseFloat(Waltamt)+parseFloat(withdata.amount);
							wallet.updateOne({user_id:mongoose.Types.ObjectId(withdata.user_id), "wallet.currency":withdata.currency},{"$set":{"wallet.$.amount": BalWith}}, {multi:true}).exec(function(waltErr,waltRes){
								if(waltRes){
									withdraw.updateOne({CIdKey:TokId},{"$set": {status: 'user_reject'}}).exec(function(err, resData){
										return res.json({success:0, msg: "Request has been Rejected !"});
									})
								}else{
									return res.json({success:0, msg: "wallet is undefined !"});
								}
							})
						}else{
							return res.json({success:0, msg: "wallet is undefined !"});
						}
					})
				}
			})
		}else{
			return res.json({success:0, msg: "withdraw data is undefind !"});
		}
	})
})

router.post('/getAddress', common.tokenMiddleware, function(req, res){
	var curr = req.body.currency;
	if(curr == "APE") {
		qrcode.toDataURL('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (err, src) => {
		    if (err) return res.json({success:0, msg : "APE token doesn't have Address"});
			return res.json({success:1, Address : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', Qrcode : src});
		});
	} else {
		currency.findOne({currency:curr}).exec(function(err, resData){
			var newtwork = resData.network;
			user_address.findOne({user_id:mongoose.Types.ObjectId(req.userId)}, {address:{$elemMatch:{currency:newtwork}},_id:0}).exec(function(addErr, addData){
				if(addData){
					var currWallet = addData.address[0];
					if(currWallet !== undefined && currWallet !== null && currWallet !== ""){
						qrcode.toDataURL(currWallet.value, (err, src) => {
						    if (err) return res.json({success:0, msg : "failed to create Address !"});
							return res.json({success:1, Address : currWallet.value, Qrcode : src});
						});
					}else{
						currency.findOne({currency:curr}).exec(function(err, resData){
					        if(resData.network == "BNB") {
					            const web3 = new Web3('https://bsc-dataseed1.binance.org:443');
					            const addr = web3.eth.accounts.create(["APEGAMEKEY"]);
					            if(addr.address) {
									user_address.updateMany({user_id:mongoose.mongo.ObjectId(req.userId)}, {$push:{address:{currency:newtwork, value:addr.address, secret:encrypt.withEncrypt(addr.privateKey)}}}).exec(function(addErr, addRes) {
										if(addRes){
											qrcode.toDataURL(addr.address, (err, src) => {
												return res.json({success:1, Address : addr.address, Qrcode : src});
											});
										}else{
											qrcode.toDataURL('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (err, src) => {
												return res.json({success:1, Address : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', Qrcode : src});
											});
										}
									});
					            } else {
					                qrcode.toDataURL('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (err, src) => {
									    if (err) return res.json({success:0, msg : "failed to create Address !"});
										return res.json({success:1, Address : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', Qrcode : src});
									});
					            }
					        }
					    });
					}
				}else{
					game.generateAddress(newtwork, req.userId);
				}
			})
		})
	}
})

module.exports = router;