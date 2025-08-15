const WebSocket = require('ws');
const socketco = new WebSocket('wss://ws.coincodex.com/subscriptions?transport=websocket');

socketco.on('open', () => {
 	console.log('WebSocket connection is open.');
 	// Subscribe to tickers here
 	const subscriptionData = {
 		// Customize this based on your needs
 		type: 'subscribe',
 		channel: 'tickers',
 		symbol: 'BTC/USD', // Example: Bitcoin/USD ticker
 	};
 	socketco.send(JSON.stringify(subscriptionData));
});

socketco.on('message', (data) => {
 	// Handle incoming data (ticker updates) here
	//const jsond = data.toString('utf8');
	const jsonO = JSON.stringify(data);
 	console.log('Received data:', jsonO);
});

socketco.on('error', (error) => {
 	console.error('WebSocket error:', error);
});