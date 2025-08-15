const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");
const socketio = require("socket.io");
const port = process.env.PORT || 13578;
const path = require("path");
const datas = require("./model/datas");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const userHome = require("./routes/basic");
const apiRoute = require("./routes/api_route");
const limbo = require("./routes/limbo");
const dice = require("./routes/dice");
const coinflip = require("./routes/coinflip");
const keno = require("./routes/keno");
const wheel = require("./routes/wheel");
const mines = require("./routes/mines");
const roulette = require("./routes/roulette");
const fortune = require("./routes/fortune");

const plunder = require("./routes/caveofplunder");
const withdraw = require("./routes/withdraw");
const sword = require("./routes/sword");
const bustabit = require("./routes/bustabit");
const plinko = require("./routes/plinko");

const support = require("./routes/support");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(
  logger("dev", {
    skip: function (req, res) {
      return res.statusCode < 400;
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.set("port", port);

// user panel
app.use("/basic", userHome);
app.use("/apiRoute", apiRoute);
app.use("/dice", dice);
app.use("/coinflip", coinflip);
app.use("/keno", keno);
app.use("/wheel", wheel);
app.use("/mines", mines);
app.use("/roulette", roulette);
app.use("/fortune", fortune);
app.use("/withdraw", withdraw);

app.use("/cave", plunder);
app.use("/sword", sword);
app.use("/plinko", plinko);

app.use("/limbo", limbo.router);
app.use("/bustabit", bustabit.router);

app.use("/support", support);

var mongoose = require("mongoose");
var server;

if (process.env.NODE_ENV == "production") {
  var credentials = {
    key: fs.readFileSync("config/wcx_exchange.key"),
    cert: fs.readFileSync("config/wcx_exchange.crt"),
  };
  var server = https.createServer(credentials, app);
  server.listen(port, () => {
    console.log("Checks - HTTPS Server running on port " + port);
  });
} else {
  var server = http.createServer(app);
  server.listen(port, () => {
    console.log("HTTP Server running on port " + port);
  });
}

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

/*------------- SOCKET --------------------*/
// var io = socketio.listen(server);
/*const io = require('socket.io')(server,{cors: {origins: ['http://localhost:4200:*', 'http://localhost:1201:*']}}, { pingInterval:200000000, pingTimeout:500000000, transports:['websocket', 'polling']});*/

const io = require("socket.io")(
  server,
  {
    cors: {
      origins: ["localhost:4200:*", "localhost:1201:*", "rollgame.io:*"],
    },
  },
  {
    pingInterval: 200000000,
    pingTimeout: 500000000,
    transports: ["websocket", "polling"],
  }
);

/*var io = socketio.listen(server, { pingInterval:200000000, pingTimeout:500000000, transports:['websocket', 'polling']});
io.set('origins', "localhost:4200:*, localhost:1201:*")*/

let commHlp = require("./helpers/common");
bustabit.SocketInit(io);
limbo.SocketInit(io);
commHlp.SocketInit(io);

let bust = require("./routes/bustabit");

io.on("connection", function (socket) {
  socket.on("cashOutReq", function (data) {
    bust.receiveInfo(data);
  });
});

module.exports = app;
