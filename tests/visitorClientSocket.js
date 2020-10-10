const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
// const warn = clc.yellow;
// const notice = clc.blue;
// const highlight = clc.magenta;
// const bold = clc.bold;

const { getNow, printJson } = require('./helpers');
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
  function log(title, message) {
    console.groupCollapsed(title);
    console.table(message);
    console.groupEnd();
  }
  try {
    const connectionMap = new Map();

    const clientSocket = io('http://localhost:3003', {
      query: { token: token },
    });

    // these are the sockets options in the Visitor.vue
    clientSocket.on('connect', () => {
      connectionMap.set(clientSocket.query.token, clientSocket);
      console.log(
        success(
          `On ${getNow()}, ${clientSocket.query.token} uses socket ${
            clientSocket.id
          }`
        )
      );
    });

    clientSocket.on('availableRoomsExposed', (message) => {
      log('Available Rooms', message);
    });

    clientSocket.on('allRoomsExposed', (message) => {
      log('All Rooms', message);
    });

    clientSocket.on('allSocketsExposed', (message) => {
      log('All Sockets', message);
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

var getConnections = new Promise(function(resolve) {
  let connectionMap = new Map();
  let vs = visitors;
  let more = visitors.length;
  vs.forEach((visitor) => {
    let socket = OpenVisitorConnection(visitor);
    socket.on('connect', () => {
      connectionMap.set(socket.query.token, socket);
      if (!--more) {
        resolve(connectionMap);
      }
    });
  });
});

DEBUG &&
  getConnections.then((connectionMap) => {
    console.table(connectionMap);
  });
