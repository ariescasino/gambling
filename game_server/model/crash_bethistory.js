const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let crashBetHistorySchema = new Schema({
	"bet_result" : Number,
	"status"        : String,
	"client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "created_at"    : { type:Date, default:Date.now },
    "users" 		: [{
    	"user_id"   : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    	"username"  : String,
		"bet_amount": Number, 
		"currency"  : String,
		"auto_cashout" : String,
		"payout"    : Number,
		"status"        : String,
		"win_lose_amt"  : Number,
		"time_status"   : {type:Number,default:0}
    }]

}, {"versionKey" : false});

module.exports = mongoose.model('crash_bet_history', crashBetHistorySchema, 'crash_bet_history');