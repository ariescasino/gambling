const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let adminSchema = new Schema({
  "username"      : String,
  "ownermail"     : { type: String, unique: true },
  "ownerkey"      : String,
  "pattern"       : String,
  "profileimg"    : String,
  "role"          : { type: Number, default: 2 },
  "access_module" : [],
  "reset_code"    : String,
  "createdDate"   : { type: Date, default: Date.now }, 
  "modifiedDate"  : { type: Date, default: Date.now },
  "status"        : { type: Number, default: 1 }
}, {"versionKey" : false});

module.exports = mongoose.model('admin', adminSchema,'admin');