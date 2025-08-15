const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let contactUsSchema = new Schema({
  "name"   : String,
  "email"  : String,
  "subject": String,
  "message": String,
  "status" : String,
  "admin_reply"  : {type: String, default: ""},
  "created_at" 	 : { type: Date, default: Date.now },
  "updated_at"   : { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('contact_us', contactUsSchema, 'contact_us');