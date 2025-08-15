var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name:'hrcsite',
  api_key: '139535362475845',
  api_secret: 'sHQIAu8n0U9GzjHnFTJ9W2FOR3Q'
});

module.exports = {
	uploadImage : function(imageName, callback){
		try {
			cloudinary.v2.uploader.upload(
				imageName,
				{
					folder: 'KYC',
					use_filename: true
				},
				function(error, result) {
					if(error == undefined) {
						callback(result)
					} else {
						callback(undefined);			
					}
				}
			);
		} catch(e) {
			callback(undefined);
		}
	},
	uploadIeo : function(imageName, callback) {
    try {
      cloudinary.v2.uploader.upload(
        imageName,
        {
          folder: 'supportImg',
          use_filename: true
        },
        function(error, result) {
          if(error == undefined) {
            callback(result)
          } else {
            callback(undefined);      
          }
        }
      );
    } catch(e) {
      callback(undefined);
    }
  }
};