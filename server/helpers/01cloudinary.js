const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({
  accessKeyId: "744525178313295",
  secretAccessKey: "20Lh2nQxV6cUB1VOj0L2Uco2ewo"
});
var s3 = new AWS.S3();

module.exports = {
	uploadImage : function(imageName, callback) {
		let baseName = path.basename(imageName);
		var params = {
		  Bucket: 'cex-trokera',
		  Body : fs.readFileSync(imageName),
		  ACL: 'public-read',
		  Key : new Date().getTime()+"_"+baseName
		};
		try {
			s3.upload(params, function (err, data) {
			  if (err) {
			  	callback(undefined);
			  } else if (data) {
			  	callback({secure_url:data.Location, original_filename:baseName});
			  }
			});
		} catch(e) {
			callback(undefined);
		}
	}
};