const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let currencySchema = new Schema({
  "game_name"     : {type:String},
  "image"         : {type:String,default:''},
  "status"        : {type:Number,default:1},
  "fav_count"     : {type:Number,default:0},
  "like_count"    : {type:Number,default:0},
  "max_bet"       : {type:Number,default:10000000000},
  "min_bet"       : {type:Number,default:0},
  "Curr"          : {type:Array},
  "created_at"    : { type:Date, default:Date.now },
  "updated_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('gameList', currencySchema, 'gameList');