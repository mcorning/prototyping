const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
// const warn = clc.yellow;
// const notice = clc.blue;
// const highlight = clc.magenta;
// const bold = clc.bold;

const { printJson } = require('./helpers');
const { visitors } = require('./visitorData');

console.log(`${moment().format('llll')}`);

const enterRoom = (clientSocket, message) => {
  clientSocket.emit('enterRoom', message, (ack) => {
    console.group('Server Acknowledged: Enter Room:');
    console.log(success(ack));
    console.groupEnd();
  });
};

const leaveRoom = (clientSocket) => {
  clientSocket.emit('leaveRoom', (rooms) => {
    console.log('Occupied Rooms:');
    console.table(rooms);
  });
};

const exposeAvailableRooms = (clientSocket) => {
  clientSocket.emit('exposeAvailableRooms', (rooms) => {
    console.log('Available Rooms:');
    console.table(rooms);
  });
};
const exposeAllRooms = (clientSocket) => {
  clientSocket.emit('exposeAllRooms', (rooms) => {
    console.log('All Rooms:');
    console.table(rooms);
  });
};
const exposeAllSockets = (clientSocket) => {
  clientSocket.emit('exposeAllSockets', (sockets) => {
    console.log('All Sockets:');
    console.table(sockets);
  });
};
const exposureWarning = (clientSocket, warnings) => {
  clientSocket.emit('exposureWarning', warnings, (ack) => {
    console.log(ack);
  });
};

function OpenVisitorConnection(token) {
  try {
    const clientSocket = io('http://localhost:3003', {
      query: { token: token },
    });

    // these are the sockets options in the Visitor.vue
    clientSocket.on('connect', () => {
      console.log(success(clientSocket.id, clientSocket.query.token));
    });

    clientSocket.on('availableRoomsExposed', (message) => {
      console.groupCollapsed('Available Rooms:');
      console.log(success(printJson(message)));
      console.groupEnd();
    });

    clientSocket.on('allRoomsExposed', (message) => {
      console.groupCollapsed('All Rooms:');
      console.log(success(printJson(message)));
      console.groupEnd();
    });

    clientSocket.on('allSocketsExposed', (message) => {
      console.groupCollapsed('All Sockets:');
      console.log(success(printJson(message)));
      console.groupEnd();
    });

    clientSocket.on('exposureAlert', (alertMessage) =>
      console.log(error('ALERT:', alertMessage))
    );

    clientSocket.on('updatedOccupancy', (message) => {
      console.log(
        success(`${message.room} occupancy is now ${message.occupancy}`)
      );
    });

    return clientSocket;
  } catch (error) {
    console.log(error('Cannot find the socket.io server.'));
  }
}

const DEBUG = 1;
module.exports = {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeAllRooms,
  exposeAllSockets,
  exposeAvailableRooms,
  leaveRoom,
};

function getConnection(token) {
  const socket = OpenVisitorConnection(token);
  socket.on('connect', () => {
    exposeAllRooms(socket);
    exposeAllSockets(socket);
  });
}
function getConnections() {
  let visitors = ['Nurse Diesel', 'Nurse Jackie', 'AirGas Inc'];
  visitors.forEach((visitor) => {
    getConnection(visitor);
  });
}
DEBUG && getConnections();
