const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let settingSchema = new Schema({
  "contact_mail"     : String, 
  "site_url"         : String,
  "site_name"        : String,
  "site_mode"        : {type: String, default:"1"}, 
  "copyright"        : String,
  "contactnumber"    : Number,
  "address"          : String,
  "facebook"         : {type: String, default: ''},
  "twitter"          : {type: String, default: ''},
  "linkedin"         : {type: String, default: ''}, 
  "instagram"        : {type: String, default: ''}, 
  "skype"            : {type: String, default: ''}, 
  "telegram"         : {type: String, default: ''},
  "updated_at"       : { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('siteSettings', settingSchema, 'sitesettings');