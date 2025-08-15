const CryptoJS = require("crypto-js");
const Cryptr = require('cryptr');
const cryptr = new Cryptr('HdanualQfDkwIfPaptnkap');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let key = "92d142#$%i43LvK^Q&C@*0";
let iv  = "BZTulrbyFMUQmqbnFvLXC";
key = CryptoJS.enc.Base64.parse(key);
iv = CryptoJS.enc.Base64.parse(iv);

let withKey = "UA$(@PSFQL-%)RV(#)$!NK";
let withIv  = "FNwefwSPusoehjgIQKFNIO";
withKey = CryptoJS.enc.Base64.parse(withKey);
withIv  = CryptoJS.enc.Base64.parse(withIv);

module.exports = {
	hashPswd : function(pass, cb) {
		bcrypt.hash(pass, saltRounds, function(err, hash) {
			cb(hash);
		});
	},
	comparePswd : function(pass, dbPass, cb) {
		bcrypt.compare(pass, dbPass, function(err, res) {
			cb(res);
		});
	},
	cmpreMultiPwd : function(pass, passArr, cb) {
		var i = 1;
		var len = passArr.length;
		if(len > 0) {
			passArr.forEach((val) => {
	      bcrypt.compare(pass, val, function(err, res) {
	        if(res) {
	        	cb(1); return;
	        } else {
	        	if(i == len) { cb(0); }
	        }
	        i = i + 1;
	      })
	    });
		} else {
			cb(0);
		}
	},
	encryptNew : function(txt){
		return CryptoJS.AES.encrypt(txt, key,{iv:iv}).toString();
	},
	encrypt_with : function(txt){
		return cryptr.encrypt(txt)
	},
	decrypt_with : function(txt){
		return cryptr.decrypt(txt)
	},
	decryptNew : function(txt){
		var bytes  = CryptoJS.AES.decrypt(txt.toString(), key, {iv:iv});
		return bytes.toString(CryptoJS.enc.Utf8);
	},
	withEncrypt : function(txt){
		return CryptoJS.AES.encrypt(txt, withKey,{iv:withIv}).toString();
	},
	withDecrypt : function(txt){
		var bytes  = CryptoJS.AES.decrypt(txt.toString(), withKey, {iv:withIv});
		return bytes.toString(CryptoJS.enc.Utf8);
	},
	siteUrl: function(req) {
		return "https://localhost:4200/";
	},
	userUrl: function(req) {
		return "https://localhost:4200/";
	},
	adminNewUrl: function() {
		return "https://localhost:4200/";
	},
	frontUrl: function() {
		return "https://localhost:4200/";
	},
	wltNewUrl: function(req) {
		return "https://localhost:4200/"; 
	},
	firstNewMail: function(email) {
		return email.substr(0, 5);
	},
	secondNewMail: function(email) {
		return email.substr(5);
	},
	encryptNewEmail : function(txt){
		let email = txt.substr(0, 5)
		return CryptoJS.AES.encrypt(email, key,{iv:iv}).toString();
	},
	generateRandom: function(string_length) {
		let str = '';
		let asci;
		let low = 65;
		let high = 90
		for(let i = 0; i < string_length; i++) {
			asci = Math.floor((Math.random() * (high - low)) + low);
			str += String.fromCharCode(asci)
		}
		return str
	},
	getQrUrl(url) {
		return 'https://chart.googleapis.com/chart?chs=168x168&chld=M|0&cht=qr&chl='+url+'';
	}
}