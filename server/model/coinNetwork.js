var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coinNetworkSchema = new Schema({
  	"user_id"       : {type: mongoose.Schema.Types.ObjectId, ref: 'user_info'},
  	"chainId"       : Number,
  	"decimals"      : Number,
  	"nw_name"       : String,
  	"DW_contract"   : String,
  	"DW_rpc"      	: String,
  	"connecttype"   : String,
  	"Network_api"   : String,
  	"Network_PK"    : String,
  	"chainName"     : String,
  	"name"      	: String,
  	"symbol"      	: String,
  	"rpcUrls"      	: String,
  	"blockExplorerUrls"  : String,
  	"ENC_privateKey"     : String,
  	"signerAddress" : String,
	"DW_abi"  		: Array,
  	"created_at"    : { type:Date, default:Date.now },
  	"updated_at"    : { type:Date, default:Date.now }
}, {"versionKey" : false});
module.exports = mongoose.model('coin_network', coinNetworkSchema, 'coin_network')