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
const warn = clc.yellow;
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

// listeners
// using named listeners makes it easier to remove listeners from socket event handlers
const onAvailableRoomsExposed = (message) => {
  console.groupCollapsed('onAvailableRoomsExposed results:');
  console.table(message);
  console.groupEnd();
};

const onAllRoomsExposed = (message) => {
  console.groupCollapsed('onAllRoomsExposed results:');
  console.table(message);
  console.groupEnd();
};

const onAllSocketsExposed = (message) => {
  console.groupCollapsed('onAllSocketsExposed results:');
  console.table(message);
  console.groupEnd();
};
const onexposureAlert = (message) => {
  console.groupCollapsed('onAllSocketsExposed results:');
  console.table(message);
  console.groupEnd();
};
// end listeners

// testing this event is not a high priority
const leaveRoom = (clientSocket, data) => {
  clientSocket.emit('leaveRoom', data, (rooms) => {
    console.log('Occupied Rooms:');
    console.table(rooms);
  });
};

const enterRoom = (clientSocket, message) => {
  clientSocket.emit('enterRoom', message, (ack) => {
    console.group('Server Acknowledged: Enter Room:');
    console.log(success(ack));
    console.groupEnd();
  });
};

const exposeAvailableRooms = (clientSocket) => {
  clientSocket.emit('exposeAvailableRooms', (rooms) => {
    console.log('Available Rooms:');
    console.table(rooms);
  });
};

const exposeOccupiedRooms = (clientSocket) => {
  clientSocket.emit('exposeOccupiedRooms', (rooms) => {
    console.log('Occupied Rooms:');
    console.table(rooms);
  });
};

const exposePendingRooms = (clientSocket) => {
  clientSocket.emit('exposePendingRooms', (rooms) => {
    console.log('Pending Rooms:');
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
    });

    clientSocket.once('connect_error', (message) => {
      switch (message.type) {
        case 'TransportError':
          console.log(
            warn(
              `${clientSocket.query.room ||
                clientSocket.query.visitor} attempted to connect...`
            )
          );
          console.log(
            error(
              '...but LCT Socket.io Server may have gone down at or before',
              getNow()
            )
          );
          break;
      }
    });

    // TODO: move these event handler details to listeners pattern
    // I believe action is necessary here only if the query options have to change (which they don't)
    clientSocket.on('reconnect_attempt', () => {
      console.log(warn(`Attempting to reconnect clientSocket:`));
      console.table(clientSocket.io.opts.query);
      // let x = visitor.filter(
      //   (v) =>
      //     (v.name == clientSocket.io.opts.query.visitor) |
      //     clientSocket.io.opts.query.room
      // );
      // clientSocket.io.opts.query = x;
    });
    clientSocket.on('availableRoomsExposed', onAvailableRoomsExposed);

    clientSocket.on('allRoomsExposed', onAllRoomsExposed);

    clientSocket.on('allSocketsExposed', onAllSocketsExposed);

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

function log(title, message) {
  console.groupCollapsed(title);
  console.table(message);
  console.groupEnd();
}

module.exports = {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeAllRooms,
  exposeAllSockets,
  exposeAvailableRooms,
  leaveRoom,
};

const TESTING = 1;
const INCLUDE = 0;

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

  const visitor = pickVisitor();
  let exposures = getExposures(visitor.name);
  let visitorSocket = connectionMap.get(visitor.name);

  let roomName = exposures[0].room;
  // 1) Open Room
  let roomSocket = OpenRoomConnection(roomName);
  roomSocket.on('connect', () => {
    const message = {
      visitor: visitor.name,
      warnings: getWarnings(visitor.name),
      sentTime: new Date().toISOString(),
    };
    // 2) Warn Rooms
    INCLUDE && exposureWarning(visitorSocket, message);
  });
}
async function testEnterRoom() {
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

  const visitor = pickVisitor();
  let exposures = getExposures(visitor.name);
  let visitorSocket = connectionMap.get(visitor.name);

  let room = exposures[0].room;
  // 1) Open Room
  let roomSocket = OpenRoomConnection(room);
  roomSocket.on('connect', () => {
    const message = {
      visitor: visitor,
      room: roomSocket.query,
      warnings: getWarnings(visitor.name),
      sentTime: new Date().toISOString(),
    };
    // 2) Enter Rooms
    enterRoom(visitorSocket, message);
  });
}

TESTING && INCLUDE && bvt();
TESTING && testEnterRoom();
