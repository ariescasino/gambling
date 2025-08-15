const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RouletteSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : Number,
    "win_lose_amt"  : Number,
    "bet_result"    : Number,
    "status"        : String,
    "userBet"       : Array,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "seed_status"   : {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},
    "created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('roulette_bet_history', RouletteSchema,'roulette_bet_history');
