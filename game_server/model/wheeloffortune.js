const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let fortuneSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_type"      : { type:String, default:'' },
    "initial_bet"   : Array,
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : Number,
    "win_lose_amt"  : Number,
    "status"        : String,
    "result"        : Number,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "game_result"   : Array,
    "seed_status"   : {type:"Number", default:0},
    "created_at"    : { type:Date, default:Date.now },
    "time_status"   : {type:Number,default:0},
}, {"versionKey" : false});

module.exports = mongoose.model('wheelFortuneGame', fortuneSchema,'wheelFortuneGame');