const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let notify = new Schema({
  "user_id"   :{ type:mongoose.Schema.Types.ObjectId, ref:'user_info' },
  "category"  : String,
  "message"   : String,
  "status"    : {type:Number, default:1},
  "type"      : {type:String, default:''},
  "created_at": { type: Date, default: Date.now },
  "updated_at": { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('notify',notify,'notify'); 
