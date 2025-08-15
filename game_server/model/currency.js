const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let currencySchema = new Schema({
  "name"             : String,
  "currency"         : String,
  "network"          : {type: String,default:""},
  "unified_cryptoasset_id"    :  Number,
  "image"            : {type: String, default: ""},
  "type"             : {type: String, default: "coin"},
  "status"           : {type: Number, default: 1 },
  "min_bet"          : {type: Number, default: 1 },
  "max_bet"          : {type: Number, default: 1 },
  "min_deposit"      : {type: Number, default: 0 }, 
  "max_deposit"      : {type: Number, default: 0 },
  "min_withdraw"     : {type: Number, default: 0 },
  "max_withdraw"     : {type: Number, default: 0 }, 
  "withdraw_fee"     : {type: Number, default: 0 },
  "transfer_fee"     : {type: Number, default: 0 },
  "deposit_status"   : {type: Number, default: 1 },
  "withdraw_status"  : {type: Number, default: 1 },
  "market_price"     : {type:Number,default:0},
  "created_at"       : {type: Date, default: Date.now },
  "updated_at"       : {type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('currency', currencySchema, 'currency');