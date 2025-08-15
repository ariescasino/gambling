let jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const async = require('async');
const cron = require('node-cron');
var Client = require('node-rest-client').Client;
var restCli = new Client();

const Web3 = require('web3');

//schemas
const users = require('../model/users');
const wallet = require('../model/userWallet');
const userHash = require('../model/user_hash');
const currency = require('../model/currency');
const userAddress = require('../model/userAddress');
const common = require('./common');

const cloudinary = require('./cloudinary');
const endecrypt = require('./encrypt');

var CryptoJS = require('crypto-js');

// const balUpdate = require('../model/balUpdates');;

const http = require('http');
const https = require('https');
const fs = require("fs");
const path = require('path');

var socket = 0;
exports.SocketInit = function (socketIO) { socket = socketIO; }
var client = [];
let authKey = 'OSgPuToUnMnSHmnIaDLAeaXa';

exports.formatTrdDate = function(time) {
  let obj = new Date(time);
  let ts = obj.getTime() / 1000;
  return parseInt(ts);
}

let getRandomString = exports.randomString = function(len){
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

exports.generateRandomUser = function(){
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 15; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


exports.generateUserHash = async function(userId, game){
    var clientSeed = getRandomString(12);
    var serverSeed = getRandomString(24);
    clientSeed = endecrypt.withEncrypt(clientSeed);
    serverSeed = endecrypt.withEncrypt(serverSeed);
    var nonce = 0;
    var new_clientSeed = endecrypt.withEncrypt(getRandomString(12));
    var new_serverSeed = endecrypt.withEncrypt(getRandomString(24));
    var obj = {client_seed:clientSeed, server_seed:serverSeed, nonce:nonce, new_server_seed: new_serverSeed, new_client_seed: new_clientSeed, game: game, user_id: mongoose.mongo.ObjectId(userId)};
    var isInsert = await userHash.create(obj);
    return obj;
}


exports.limboGameResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);
    var hmacWA        = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    let val           = hmacWA.toString();
    var hmacDirectWA  = CryptoJS.HmacSHA256(clientSeed + ':' + nonce, serverSeed);
    var fss           = hmacDirectWA.toString();
    let seed      = fss;
    var nBits     = 52; 
    var f         = nBits/4
    var u         = seed.toString().slice(0, f);
    const r       = parseInt(u, 16);
    let X         = r / Math.pow(2, nBits);
    X             = 99 / (1 - X);
    const result  = Math.floor(X);
    var bet_result        = serverSeed? Math.max(1, result / 100) : '';

    return bet_result;
}

exports.diceGameResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sha=CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var val=sha.toString();
    var hmacDirectWA = CryptoJS.HmacSHA256(clientSeed + ':' + nonce, serverSeed);
    var fss=hmacDirectWA.toString();

    let list = fss
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    let num = 0
    let rt = rest.hex
    for (let i = 0; i < 4; i++) {
        num += rt[i] / Math.pow(256, (i + 1))
    }
    var numResult=num.toFixed(9)
    var gameresult=(numResult* 100.01).toFixed(2);

    return gameresult;
}


exports.coinflipGameResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    const firstStep = rest.hex[0]/(Math.pow(256, 1));
    const secondStep = rest.hex[1]/(Math.pow(256, 2));
    const thirdStep = rest.hex[2]/(Math.pow(256, 3));
    const fourthStep = rest.hex[3]/(Math.pow(256, 4));
    const resultStep = (firstStep + secondStep + thirdStep + fourthStep) * 2;
    const result = Math.floor(resultStep);var outcomes = ["heads", "tails"];
    var gameresult = outcomes[result];
    return gameresult;
}

exports.kenoGameResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    const allNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
    const seed=get_cliHash;
    var  finalNums = createNums(allNums, seed);
    finalNums = createNums(finalNums, seed);
    finalNums=finalNums.slice(0, 10).map(m => m.num)
    finalNums=finalNums.map(s => s.num)

    return finalNums;
}

function createNums(allNums, hash) {
    const nums = [];
    let h = CryptoJS.SHA256(hash).toString(CryptoJS.enc.Hex);
    allNums.forEach((c) => {
        nums.push({ num: c, hash: h });
        h = h.substring(1) + h.charAt(0);
    });
 
    nums.sort(function (o1, o2) {
        if (o1.hash < o2.hash) {
            return -1;
        } else if (o1.hash === o2.hash) {
            return 0;
        } else {
            return 1;
        }
    });
  return nums;
}

exports.wheelGameResult = function(serverSeed, clientSeed, nonce, segment) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();


    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();
    
    let list = get_cliHash
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    let num = 0;let rt = rest.hex
    for (let i = 0; i < 4; i++) {
        num += rt[i] / Math.pow(256, (i + 1))
    }

    // var numResult=num.toFixed(9)
    var segment_result=num*segment;

    return segment_result;

}

exports.minesGameResult = function(serverSeed, clientSeed, nonce, boom) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();
    
    const allNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    const seed=get_cliHash;
    var  finalNums = createNums(allNums, seed);
    finalNums = createNums(finalNums, seed);
    finalNums=finalNums.slice(0, boom).map(m => m.num)
    finalNums=finalNums.map(s => s.num)
    return finalNums;
}



exports.caveGameResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA512(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    var index = 0;
        do {
            var lucky = parseInt (get_cliHash.substr (index, 5), 16);
            index= index+ 5;
        }   while (lucky >= 1000000);

    const value = lucky;
    const ranges = [
        [0,158289],
        [206250,288750],
        [292834,390685],
        [565562,1000000],
        [546641,659980]
    ];

    let rangeIndex = -1;

    for (let i = 0; i < ranges.length; i++) {
        const [min, max] = ranges[i];
        if (value >= min && value <= max) {
          rangeIndex = i;
          break; // If the value is within any of the ranges, exit the loop
        }
    }
    var checking=(rangeIndex == 0 ) ? "book" : (rangeIndex == 1) ? "cross" : (rangeIndex == 2) ? "diamond" : (rangeIndex == 3 ) ? "none" : "skull" 
    // const allNums = [1, 2, 3, 4, 5]
    // const seed=get_cliHash;
    // var  finalNums = createNums(allNums, seed);
    // finalNums = createNums(finalNums, seed);
    // finalNums=finalNums.slice(0, 1).map(m => m.num)
    // finalNums=finalNums.map(s => s.num)
    return checking;
    // return "cross";
}


exports.ringofFortune = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);


    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    let num = 0;let rt = rest.hex
    for (let i = 0; i < 4; i++) {
        num += rt[i] / Math.pow(256, (i + 1))
    }

    var numResult=num.toFixed(9)
    var result=numResult*24;
    if(result>24){ result=24 }

    return result;

}

exports.rouletteGame = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    const firstStep = rest.hex[0]/(Math.pow(256, 1));
    const secondStep =rest.hex[1]/(Math.pow(256, 2));
    const thirdStep = rest.hex[2]/(Math.pow(256, 3));
    const fourthStep =rest.hex[3]/(Math.pow(256, 4));
    const resultStep = (firstStep + secondStep + thirdStep + fourthStep) * 37;
    const result = Math.floor(resultStep);

    return result;
}

exports.generateAddress = function(curr, userId) {
    currency.findOne({currency:curr}).exec(function(err, res){
        if(res.network == "BNB") {
            const web3 = new Web3('https://bsc-dataseed1.binance.org:443');
            const addr = web3.eth.accounts.create(["APEGAMEKEY"]);
            if(addr.address) {
                var obj ={user_id:mongoose.mongo.ObjectId(userId), address: [{currency:"BNB", value:addr.address, secret:endecrypt.withEncrypt(addr.privateKey)}]};
                userAddress.create(obj, function(err, res){
                    if(res) { return addr.address; }
                    if(err) { return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; } 
                });
            } else {
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            }
        }
    }); 
}


exports.caveWheelResult = function(serverSeed, clientSeed, nonce) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed + ':' +nonce,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash
    let rest = {
        dec: [],
        hex: []
    }

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

    let num = 0;let rt = rest.hex
    for (let i = 0; i < 4; i++) {
        num += rt[i] / Math.pow(256, (i + 1))
    }

    var numResult=num.toFixed(9)
    var result=numResult*5;
    if(result>5){ result=5 }

    return parseInt(result) * 100;

}


exports.swordResult =function(serverSeed, clientSeed, nonce, round) {
    serverSeed = endecrypt.withDecrypt(serverSeed);
    clientSeed = endecrypt.withDecrypt(clientSeed);

    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed+':'+nonce+":"+round,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash;let rest = { dec: [],hex: [] };

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

//first reel result
    const firstStep   = rest.hex[0]/(Math.pow(256, 1));
    const secondStep  = rest.hex[1]/(Math.pow(256, 2));
    const thirdStep   = rest.hex[2]/(Math.pow(256, 3));
    const fourthStep  = rest.hex[3]/(Math.pow(256, 4));
    const resultStep1 = (firstStep + secondStep + thirdStep + fourthStep);
    const result1     = resultStep1 * 17835;

//second reel result
    const firstStep1= rest.hex[4]/(Math.pow(256, 1));
    const secondStep2=rest.hex[5]/(Math.pow(256, 2));
    const thirdStep3= rest.hex[6]/(Math.pow(256, 3));
    const fourthStep4=rest.hex[7]/(Math.pow(256, 4));
    const resultStep2 = (firstStep1 + secondStep2 + thirdStep3 + fourthStep4);
    const result2 =resultStep2* 20355;

//third reel result
    const first=rest.hex[8]/(Math.pow(256, 1));
    const second=rest.hex[9]/(Math.pow(256, 2));
    const third=rest.hex[10]/(Math.pow(256, 3));
    const fourth=rest.hex[11]/(Math.pow(256, 4));
    const resultStep3 = (first + second + third + fourth);
    const result3 = resultStep3*20352;

//fourth reel result
    const Step1=rest.hex[12]/(Math.pow(256, 1));
    const Step2=rest.hex[13]/(Math.pow(256, 2));
    const Step3=rest.hex[14]/(Math.pow(256, 3));
    const Step4=rest.hex[15]/(Math.pow(256, 4));
    const resultStep4 = (Step1 + Step2 + Step3 + Step4);
    const result4 = resultStep4*17150;

//fifth reel result
    const fStep1 = rest.hex[16]/(Math.pow(256, 1));
    const fStep2 =rest.hex[17]/(Math.pow(256, 2));
    const fStep3 = rest.hex[18]/(Math.pow(256, 3));
    const fStep4 =rest.hex[19]/(Math.pow(256, 4));
    const resultStep5 = (fStep1 + fStep2 + fStep3 + fStep4);
    const result5 = resultStep5*17835;

    
    const value1 = Math.floor(result1);const value2 = Math.floor(result2);
    const value3 = Math.floor(result3);const value4 = Math.floor(result4);
    const value5 = Math.floor(result5);

    const reelrange1 = [[0,5],[5,15],[15,30],[30,55],[55,105],[105,205],[205,355],[355,855],
    [855,1355],[1355,1855],[1855,2355],[2355,6225],[6225,10095],[10095,13965],[13965,17835]];

    const reelrange2 = [[0,5],[5,15],[15,30],[30,55],[55,105],[105,205],[205,355],[355,855],
    [855,1355],[1355,1855],[1855,2355],[2355,5355],[5355,8355],[8355,11355],[11355,14355],
    [14355,15355],[15355,20355]];

    const reelrange3 = [[0,5],[5,15],[15,30],[30,55],[55,105],[105,205],[205,355],[355,855],
    [855,1355],[1355,1855],[1855,2355],[2355,5355],[5355,8355],[8355,11355],[11355,14355],
    [14355,15355],[15355,20352]];

    const reelrange4 = [[0,5],[5,15],[15,30],[30,55],[55,105],[105,205],[205,355],[355,855],
    [855,1355],[1355,1855],[1855,2355],[2355,5355],[5355,8355],[8355,11355],[11355,14355],
    [14355,15355],[15355,17150]];

    const reelrange5 = [[0,5],[5,15],[15,30],[30,55],[55,105],[105,205],[205,355],[355,855],
    [855,1355],[1355,1855],[1855,2355],[2355,6225],[6225,10095],[10095,13965],[13965,17895]];

    var reel1 = common.reelrange(reelrange1,value1);
    var reel5 = common.reelrange(reelrange5,value5);
    var reel2 = common.reelrange(reelrange2,value2);
    var reel3 = common.reelrange(reelrange3,value3);
    var reel4 = common.reelrange(reelrange4,value4);

    /*var reel2 = 16;
    var reel3 = 16;
    var reel4 = 16;*/

    if(reel2==15){var catspin1 = common.catspin(resultStep2);
    }else{ var catspin1 = null }

    if(reel3==15){var catspin2 = common.catspin(resultStep3);
    }else{ var catspin2 = null}

    if(reel4==15){var catspin3 = common.catspin(resultStep4);
    }else{ var catspin3=null}

    if((reel2==16 || catspin1==11 ) && (reel3==16 || catspin2==11) && (reel4==16 || catspin3==11)){ 
        var sword=swordLuckspin(resultStep1);
        // var sword=20;
    }else{ var sword=""; }

    var swordResult=[reel1,reel2,reel3,reel4,reel5,];
    var catspin=[catspin1,catspin2,catspin3]
    var allresult={"swordResult":swordResult,"catspin":catspin,sword:sword}
    return allresult;
}

function afterswordResult (result) {
    var bonusSpin=result*5650;

    var range=[ [0,50],[50,150],[150,300],[300,550],[550,850],[850,1250],[1250,1650],[1650,2150],
    [2150,2650],[2650,3150],[3150,3650],[3650,4150],[4150,4650],[4650,5150],[5150,5650]]

    var spinResult=common.reelrange(range,bonusSpin);
    return spinResult;

}

function swordLuckspin (result) {
    var spin=result*185;
    var payout=[20,30,50,100,1,2,3,5];
    const randomIndex = Math.floor(Math.random() * payout.length);
    const payout_price = payout[randomIndex];
    return payout_price;
}

exports.AfterswordResult =function(serverSeed, clientSeed, nonce, round ,positions) {
    var sereverHash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(serverSeed));
    var get_serHash = sereverHash.toString();

    var clientHash  = CryptoJS.HmacSHA256(clientSeed+':'+nonce+":"+round,serverSeed);
    var get_cliHash = clientHash.toString();

    let list = get_cliHash;let rest = { dec: [],hex: [] };

    for (let i = 0; i < list.length; i += 2) {
        let dext = list[i] + list[i + 1]
        let hext = parseInt(dext, 16)
        rest.dec.push(dext)  
        rest.hex.push(hext)
    }

//first reel result
    const firstStep   = rest.hex[0]/(Math.pow(256, 1));
    const secondStep  = rest.hex[1]/(Math.pow(256, 2));
    const thirdStep   = rest.hex[2]/(Math.pow(256, 3));
    const fourthStep  = rest.hex[3]/(Math.pow(256, 4));
    const resultStep1 = (firstStep + secondStep + thirdStep + fourthStep);

//second reel result
    const firstStep1= rest.hex[4]/(Math.pow(256, 1));
    const secondStep2=rest.hex[5]/(Math.pow(256, 2));
    const thirdStep3= rest.hex[6]/(Math.pow(256, 3));
    const fourthStep4=rest.hex[7]/(Math.pow(256, 4));
    const resultStep2 = (firstStep1 + secondStep2 + thirdStep3 + fourthStep4);

//third reel result
    const first=rest.hex[8]/(Math.pow(256, 1));
    const second=rest.hex[9]/(Math.pow(256, 2));
    const third=rest.hex[10]/(Math.pow(256, 3));
    const fourth=rest.hex[11]/(Math.pow(256, 4));
    const resultStep3 = (first + second + third + fourth);

//fourth reel result
    const Step1=rest.hex[12]/(Math.pow(256, 1));
    const Step2=rest.hex[13]/(Math.pow(256, 2));
    const Step3=rest.hex[14]/(Math.pow(256, 3));
    const Step4=rest.hex[15]/(Math.pow(256, 4));
    const resultStep4 = (Step1 + Step2 + Step3 + Step4);

//fifth reel result
    const fStep1 = rest.hex[16]/(Math.pow(256, 1));
    const fStep2 =rest.hex[17]/(Math.pow(256, 2));
    const fStep3 = rest.hex[18]/(Math.pow(256, 3));
    const fStep4 =rest.hex[19]/(Math.pow(256, 4));
    const resultStep5 = (fStep1 + fStep2 + fStep3 + fStep4);

    if(positions==null){
        var result_sword1=afterswordResult(resultStep1);
        var result_sword2=afterswordResult(resultStep2);
        var result_sword3=afterswordResult(resultStep3);
        var result_sword4=afterswordResult(resultStep4);
        var result_sword5=afterswordResult(resultStep5);
        var all_res=[result_sword1,result_sword2,result_sword3,result_sword4,result_sword5]
        return all_res;
    }else{
        var result_sword1=null;var result_sword2=null;var result_sword3=null;var result_sword4=null;
        var result_sword5=null;var data=[];

        var i = 1; var len = positions.length;
        positions.forEach((element) => {
            if(element==0){
                result_sword1=afterswordResult(resultStep1);
            }else if(element==1){
                result_sword2=afterswordResult(resultStep2);
            }else if(element==2){
                result_sword3=afterswordResult(resultStep3);
            }else if(element==3){
                result_sword4=afterswordResult(resultStep4);
            }else{
                result_sword5=afterswordResult(resultStep5);
            }
            // var all_res=[result_sword1,result_sword2,result_sword3,result_sword4,result_sword5]
            // return all_res

            if(i == len) { 
                data.push(result_sword1,result_sword2,result_sword3,result_sword4,result_sword5) 
            }
            i = i + 1;
        });

        return data
    }
}

exports.MinesBetGameResult = function(m, d) {
    var n=25,x=25-m;
    function factorial(number){
      var value = number;
      for ( var i = number; i > 1; i-- )
        value *= i - 1;
      return value;
    };
    function combination(n, d){
      if ( n == d) return 1;
      return factorial(n) / (factorial(d) * factorial(n - d));
    };
    var first=combination(n, d);
    var second=combination(x, d);
    var payout=0.99*(first/second);
    return payout;
}