const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let blockipSchema = new Schema({
  "ip_addr"   : String,
  "status"    : {type: Number, default:1},
  "created_at": { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('blockip', blockipSchema, 'blockip');
