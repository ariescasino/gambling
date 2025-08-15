// Bring Mongoose into the app
const mongoose = require( 'mongoose' );
const config   = require("../config/config");
mongoose.set("strictQuery", false);
mongoose.connect(config.dbconnection, {useNewUrlParser:true, useUnifiedTopology:true});