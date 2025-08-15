const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let whiteipSchema = new Schema({
  "ip_addr"   : String,
  "name"      : {type: String, default:""},
  "added_ip"  : {type: String, default:""},
  "status"    : {type: Number, default:1},
  "ip_otp"    : String,
  "created_at": {type: Date, default:Date.now}
}, {"versionKey" : false});

module.exports = mongoose.model('whiteip', whiteipSchema, 'whiteip');
