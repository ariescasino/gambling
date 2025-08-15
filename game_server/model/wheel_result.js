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
    "risk"          : String,
    "segment"       : Number,
    "status"        : String,
    "result"        : Number,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "seed_status"   : {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},
    "created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('wheelGame_history', kenoSchema,'wheelGame_history');