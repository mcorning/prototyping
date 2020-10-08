const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

console.log(`${moment().format('llll')} Opened visitorClientSocket`);

function OpenVisitorConnection(token) {
  const clientSocket = io('http://localhost:3003', {
    query: { token: token },
  });
  // clientSocket.on('connect'...) is in the stateMachine so the event handler
  // can run the model
  clientSocket.on('connect', () => {
    console.log(success(clientSocket.id, clientSocket.query.token));
  });

  clientSocket.on('disconnecting', () => {
    console.log(warn('Disconnecting:', clientSocket.id, name));
  });
  return clientSocket;
}

module.exports = { OpenVisitorConnection };
