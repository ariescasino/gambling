const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");
// const https = require('https').globalAgent.options.ca = require('ssl-root-cas/latest').create();
const socketio = require("socket.io");
const port = process.env.PORT || 29188;
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

// user modules
var datas = require("./model/datas");

const admin = require("./routes/userApi/admin");
const cms = require("./routes/userApi/cms");
const home = require("./routes/userApi/home");
const users = require("./routes/userApi/users");
const history = require("./routes/userApi/history");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
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
// set port
app.set("port", port);

// user panel

app.use("/admin", admin);
app.use("/cms", cms);
app.use("/home", home);
app.use("/users", users);
app.use("/history", history);

var mongoose = require("mongoose");
var server;
if (process.env.NODE_ENV == "production") {
  var credentials = {};
  var server = https.createServer(credentials, app);
  server.listen(port, () => {
    console.log("HTTPS Server running on port " + port);
  });
} else {
  var server = http.createServer(app);
  server.listen(port, () => {
    console.log("HTTP Server running on port " + port);
  });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
