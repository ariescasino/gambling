const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let adminSchema = new Schema({
    "user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "game"          : String, 
    "bet_type"      : { type:String, default:'' },
    "roll_value"    : { type:Number, default:'' },
    "bet_amount"    : Number, 
    "currency"      : String,
    "payout"        : Number,
    "bet_result"    : Number,
    "status"        : String,
    "win_lose_amt"  : Number,
    "client_seed"   : String,
    "server_seed"   : String,
    "nonce"         : String,
    "time_status"   : {type:Number,default:0},
    "seed_status"   : {type:Number,default:0},
    "created_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('bet_history', adminSchema,'bet_history');