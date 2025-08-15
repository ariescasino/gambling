const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let viplvlSchema = new Schema({
  "level"           : {type: String, default:''},
  "XP"              : {type: Number, default:0},
  "Bonus"           : {type: Number, default:0},
  "type"            : {type: String, default:''},
  "created_at"      : { type:Date, default:Date.now },
  "updated_at"      : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('vip_level', viplvlSchema,'vip_level');