const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const async  = require('async');

const moment = require('moment');
const validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');

//helpers
const encrypt = require('../helpers/encrypt');
const common = require('../helpers/common');
const mail = require('../helpers/mail');

//schemas
const users = require('../model/users');
const logs = require('../model/user_history');
const currency = require('../model/currency');
const wallet = require('../model/userWallet');
const referrals = require('../model/referral');

router.post('/getResponse', function (req, res) {
	return res.json({success:1,msg:"response caught successfully"});
})


router.get('/getResponseGET', function (req, res) {
	return res.json({success:1,msg:"response caught successfully"});
})


module.exports = router;