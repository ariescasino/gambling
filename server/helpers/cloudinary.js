const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name:'dqhx7uxfd',
  api_key: '744525178313295',
  api_secret: '20Lh2nQxV6cUB1VOj0L2Uco2ewo'
});

module.exports = {
	uploadImage : function(imageName, callback) {
		try {
			cloudinary.v2.uploader.upload(imageName, {folder:'token', use_filename:true}, function(error, result) {
				if(error == undefined) { callback(result) } else { callback(undefined);	}
			});
		} catch(e) {
			callback(undefined);
		}
	},
};