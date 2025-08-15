const crypto = require('crypto');

const clientSeed = 'my-client-seed';
const nonce = '2';
const serverSeed = 'my-server-seed';

const message = clientSeed + ':' + nonce + ':' + serverSeed;
const secret = 'my-secret-key';

const hash = crypto.createHmac('sha256', secret)
                   .update(message)
                   .digest('hex');

console.log(hash);