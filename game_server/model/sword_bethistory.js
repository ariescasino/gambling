const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let swordSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : {type:Number, default:0},
    "win_lose_amt"  : {type:Number, default: 0},
    "status"        : String,
    "spin_result"   : String,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "respin"        : {type:Array},
    "game_result"   : {type:Array},
    "catspin_result": {type:Array},
    "created_at"    : { type:Date, default:Date.now },
    "seed_status"   : {type:"Number", default:0},
    "time_status"   : {type:Number,default:0},

}, {"versionKey" : false});

module.exports = mongoose.model('sword_bethistory', swordSchema,'sword_bethistory');
