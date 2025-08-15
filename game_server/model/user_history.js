const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let adminSchema = new Schema({
    "user_id"    : {type: mongoose.Schema.Types.ObjectId, ref: 'admin'},
    "ipaddress"  : String,   
    "browser"    : String,
    "deviceinfo" : String,
    "datetime"   : {type: Date, default: Date.now },
    "status"     : {type:Number, default:1}
}, {"versionKey" : false});

module.exports = mongoose.model('user_history', adminSchema,'user_history');