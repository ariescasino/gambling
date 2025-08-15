var nodemailer = require("nodemailer");
var mongoose = require("mongoose");
var emailtemp = require("../model/emailtemplate");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  auth: {
    user: "adebayour66265@gmail.com",
    pass: "shvtztdszgbslenb",
  },
});

module.exports = {
  sendMail: function (to, tempName, specialVar, callback) {
    emailtemp.find({ title: tempName }).exec(function (etemperr, tempContent) {
      const specialVars = specialVar;
      var subject = tempContent[0].mailsubject;
      var html = tempContent[0].mailcontent;
      for (var key in specialVars) {
        if (specialVars.hasOwnProperty(key)) {
          subject = subject.replace(key, specialVars[key]);
        }
      }
      for (var key in specialVars) {
        if (specialVars.hasOwnProperty(key)) {
          html = html.replace(key, specialVars[key]);
        }
      }
      let mailOptions = {
        from: '"ROLL GAME" <adebayour66265@gmail.com>',
        to: to,
        subject: subject,
        html: html,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Email error:" + error);
        }
        console.log("Success");
        callback(true);
      });
    });
  },
};
