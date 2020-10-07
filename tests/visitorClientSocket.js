const io = require('socket.io-client');
const moment = require('moment');

const clientSocket = io('http://localhost:3003', {
  query: { token: 'visitor' },
});
// clientSocket.on('connect'...) is in the stateMachine so the event handler
// can run the model

clientSocket.on('disconnecting', () => {
  console.log('Disconnecting:', clientSocket.id, name);
});

const VisitorSocket = clientSocket;

module.exports = { VisitorSocket };
