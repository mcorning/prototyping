// This code is a wrapper around LCT socket.io server.
// there is a corresponding file, roomClientSocket.
// each file has its own closure for Room or Visitor events
// potential refactor will have a main script that requires both client socket files

// for this file, here are our test priorities:
// basic data flow:
// 1) open Room(s) [note: at this writing, we are opening a Room in this code (as apposed to using roomClientSocket.js)]
// 2) warn Room
// Result: room will see a warning, and Visitor will see acknowledgement of warning receipt

// other tests include testing for multiple Visitor alerts and Room pending warnings

const io = require('socket.io-client');
const moment = require('moment');
const base64id = require('base64id');

const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
// const warn = clc.yellow;
// const notice = clc.blue;
// const highlight = clc.magenta;
// const bold = clc.bold;

const { getNow, printJson } = require('./helpers');

const {
  getExposures,
  getWarnings,
  pickVisitor,
  visitors,
} = require('./visitorData');

const {
  OpenRoomConnection,
  openRoom,
  alertVisitor,
} = require('./roomClientSocket');

console.log(`${moment().format('llll')}`);

const enterRoom = (clientSocket, message) => {
  clientSocket.emit('enterRoom', message, (ack) => {
    console.group('Server Acknowledged: Enter Room:');
    console.log(success(ack));
    console.groupEnd();
  });
};

// testing this event is not a high priority
const leaveRoom = (clientSocket, data) => {
  clientSocket.emit('leaveRoom', data, (rooms) => {
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
const exposureWarning = (clientSocket, message) => {
  clientSocket.emit('exposureWarning', message, (ack) => {
    console.warn(ack);
  });
};

// function OpenVisitorConnection(token, clientSocketId = '', nsp='/') {
function OpenVisitorConnection(visitor) {
  try {
    const id = visitor.id || base64id.generateId();
    const nsp = visitor.nsp || '/';
    const query = { visitor: visitor.name, id: id, nsp: nsp };
    console.table(query);
    const connectionMap = new Map();

    const clientSocket = io('http://localhost:3003', {
      query: query,
    });

    // these are the sockets options in the Visitor.vue
    clientSocket.on('connect', () => {
      connectionMap.set(clientSocket.query.visitor, clientSocket);
      console.log(
        success(
          `On ${getNow()}, ${clientSocket.query.visitor} uses socket ${
            clientSocket.id
          }`
        )
      );
      function log(title, message) {
        console.groupCollapsed(title);
        console.table(message);
        console.groupEnd();
      }
    });
    clientSocket.on('reconnect_attempt', () => {
      clientSocket.io.opts.query = {
        token: 'fgh',
      };
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

const TESTING = 1;

module.exports = {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeAllRooms,
  exposeAllSockets,
  exposeAvailableRooms,
  leaveRoom,
};

async function bvt() {
  // test helpers
  var getConnections = new Promise(function(resolve) {
    let connectionMap = new Map();
    let vs = visitors;
    let more = visitors.length;
    vs.forEach((visitor) => {
      let socket = OpenVisitorConnection(visitor);
      socket.on('connect', () => {
        connectionMap.set(socket.query.visitor, socket);
        if (!--more) {
          resolve(connectionMap);
        }
      });
    });
  });

  let connectionMap = await getConnections;
  console.table(connectionMap);

  const visitorName = pickVisitor();
  let exposures = getExposures(visitorName);
  let visitorSocket = connectionMap.get(visitorName);

  let roomName = exposures[0].room;
  // 1) Open Room
  let roomSocket = OpenRoomConnection(roomName);
  roomSocket.on('connect', () => {
    // Example message:
    // {
    //    sentTime:'2020-09-19T00:56:54.570Z',
    //    visitor:'Nurse Jackie',
    //    warnings:{
    //      Heathlands.Medical:[
    //        '2020-09-19T00:33:04.248Z', '2020-09-19T00:35:38.078Z', '2020-09-14T02:53:33.738Z', '2020-09-18T02:53:35.050Z'
    //      ]
    //    }
    // };

    const message = {
      visitor: visitorName,
      warnings: getWarnings(visitorName),
      sentTime: new Date().toISOString(),
    };
    // 3) Warn Rooms
    exposureWarning(visitorSocket, message);
  });
}

TESTING && bvt();
