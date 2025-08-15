const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let referralSchema = new Schema({
  "user_id" 	 : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
  "username" 	 : String,   
  "refer_id"   : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
  "refer_name" : String,
  "amount" 		 : Number,
  "currency" 	 : String,
  "type"		 	 : String,
  "created_at" : {type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('referral', referralSchema,'referral');