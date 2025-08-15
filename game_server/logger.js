var winston      = require('winston');
var path         = require('path');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename:  path.join(__dirname, './') + '/logs/debug.log', json: false })
  ],
  exceptionHandlers: [    
    new winston.transports.File({ filename:  path.join(__dirname, './') + '/logs/execption.log', json: false })
  ],
  exitOnError: false
});

module.exports = logger;