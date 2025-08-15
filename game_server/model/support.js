var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var supportSchema = new Schema({
  "userName"       : { type:String},
  "email"          : { type:String},
  "SelectedOption" : String,
  "Query"          : {type:String},
  "ProofUrl"       : { type: String, default: ''},
  "MessageId"      : String,
  "Status"         : { type: Number, default: 0},
  "admin_reply"    : { type: String, default: ''},
  "created_at"     : { type: Date, default: Date.now },
  "closed_at"      : { type: Date, default: Date.now }
}, {"versionKey" : false});
module.exports = mongoose.model('user_support', supportSchema, 'user_support')