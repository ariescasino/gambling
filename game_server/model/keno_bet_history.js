const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let kenoSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_type"      : { type:String, default:'' },
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : Number,
    "win_lose_amt"  : Number,
    "status"        : String,
    "bet_user"		: Array,
    "bet_matched"	: Array,
    "bet_notmatch"	: Array,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "seed_status"   : {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},
    "created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('keno_bet_history', kenoSchema,'keno_bet_history');