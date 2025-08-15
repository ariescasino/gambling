const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let spinBonusSchema = new Schema({
  "user_id"   : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
  "type"      : {type: String, default: ''},
  "bonus"     : {type: Number, default: 0},
  "currency"  : {type: String, default: ''},
  "created_at": { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('spin_bonus',spinBonusSchema,'spin_bonus');