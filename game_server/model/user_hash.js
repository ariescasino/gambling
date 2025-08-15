const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let adminSchema = new Schema({
    "user_id"           : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
    "client_seed"       : String,   
    "server_seed"       : String,
    "nonce"             : Number,
    "new_server_seed"   : String,
    "new_client_seed"   : String,
    "game"              : String,
    "datetime"          : {type: Date, default: Date.now },
    "status"            : {type:Number, default:1}
}, {"versionKey" : false});

module.exports = mongoose.model('user_hash', adminSchema,'user_hash');