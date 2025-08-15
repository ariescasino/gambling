const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let plinkoSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : {type:Number, default:0},
    "win_lose_amt"  : {type:Number, default: 0},
    "status"        : String,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "created_at"    : { type:Date, default:Date.now },
    "seed_status"   : {type:"Number", default:0},
    "time_status"   : {type:Number,default:0}
}, {"versionKey" : false});

module.exports = mongoose.model('plinko_bethistory', plinkoSchema,'plinko_bethistory');
