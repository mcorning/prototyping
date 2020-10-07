const io = require('socket.io-client');
const moment = require('moment');
console.log(`${moment().format('llll')} Opened visitorClientSocket`);

function OpenVisitorConnection(token) {
  const clientSocket = io('http://localhost:3003', {
    query: { token: token },
  });
  // clientSocket.on('connect'...) is in the stateMachine so the event handler
  // can run the model

  clientSocket.on('disconnecting', () => {
    console.log('Disconnecting:', clientSocket.id, name);
  });
  return clientSocket;
}

module.exports = { OpenVisitorConnection };
