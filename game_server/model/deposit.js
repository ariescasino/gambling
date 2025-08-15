const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let depositSchema = new Schema({
  "user_id"       : { type:mongoose.Schema.Types.ObjectId, ref:'user_info' },
  "amount"        : String,
  "reference_no"  : String,
  "payment_method": String,
  "currency"      : String,
  "status"        : String,
  "block"         : { type:String, default:'' },
  "payment_type"  : String,
  "currency_type" : { type:String, default:'crypto' },
  "dep_bank_info" : { type:String, default:'' },
  "address_info"  : String,
  "ip_address"    : { type:String, default:'' },
  "proof"         : { type:String, default:'' },
  "reason"        : { type:String, default:'' },
  "total"         : { type:String, default:'' },
  "fees"          : String,
  "move_status"   : { type:Number, default:0 },
  "created_at"    : { type:Date, default:Date.now },
  "updated_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});





module.exports = mongoose.model('deposit', depositSchema, 'deposit');