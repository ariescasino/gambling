const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let emailtemplateSchema = new Schema({
  "title": String,
  "mailsubject": String,
  "mailcontent": String,
  "created_at": { type: Date, default: Date.now },
  "updated_at": { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('emailtemplate', emailtemplateSchema,'emailtemplate');