const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let blogSchema = new Schema({
  "title"  : {type:String, default:''},
  "message"   : {type:String, default:''},
  "status"    : {type:Number, default:1},
  "image"     : {type:String, default:''},
  "created_at": { type: Date, default: Date.now },
  "updated_at": { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('blog',blogSchema,'blog');