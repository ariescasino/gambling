var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var profitSchema = new Schema({
  "user_id"     : { type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
  "currency"    : String,
  "amount"      : Number,
  "type"        : String,
  "created_at"  : { type: Date, default: Date.now }
}, {"versionKey" : false});
module.exports = mongoose.model('profit', profitSchema, 'profit')