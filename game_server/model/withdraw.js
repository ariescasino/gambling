const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let withdrawSchema = new Schema({
  "user_id"         : { type:mongoose.Schema.Types.ObjectId, ref:'user_info' },
  "amount"          : { type:Number, default:0 },
  "transfer_amount" : { type:Number, default:0 },
  "currency"        : String,
  "currency_type"   : { type:String, default:"crypto" },
  "payment_method"  : String,
  "reference_no"    : { type:String, default:"" },
  "address_info"    : String,
  "fee_amt"         : Number,
  "CIdKey"          : {type:String},
  "status"          : { type:String, default:"process" },
  "created_at"      : { type:Date, default:Date.now },
  "updated_at"      : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('withdraw', withdrawSchema,'withdraw');