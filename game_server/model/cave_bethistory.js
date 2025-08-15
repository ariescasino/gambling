const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let minesBetHistorySchema = new Schema({
 	"user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
 	"bet_amount"    : Number,
 	"currency"      : String,
 	"payout"        : Number,
 	"bet_result"    : String,
 	"status"        : String,
	"win_lose_amt"  : Number,
	"game"			: String,
	"client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "win_lose_amt"	: {type:"Number", default:0},
    "seed_status"	: {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},
 	"created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('cave_bet_history', minesBetHistorySchema, 'cave_bet_history');