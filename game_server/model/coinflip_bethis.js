const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let coinflipBetHistorySchema = new Schema({
 	"user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
 	"bet_amount"    : Number,
 	"currency"      : String,
 	"payout"        : Number,
 	"bet_result"    : Array,
 	"status"        : String,
	"win_lose_amt"  : Number,
	"game"  		: String,
	"client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "seed_status"	: {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},
 	"created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('coinflip_bet_history', coinflipBetHistorySchema, 'coinflip_bet_history');