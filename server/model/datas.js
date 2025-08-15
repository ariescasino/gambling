// Bring Mongoose into the app
var mongoose = require( 'mongoose' );
var config   = require("../config/config");

/* DB connection */ 
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

mongoose.connect(config.dbconnection, {useNewUrlParser:true, useUnifiedTopology:true});