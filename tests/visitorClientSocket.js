//#region Preample

// This code is a wrapper around LCT socket.io server.
// There are three sections:
//   1) Room events
//   2) Room named listeners (that print State)
//   3) Event handlers (that call the named listeners)

// there is a corresponding file, roomClientSocket.
// each file has its own closure for Room or Visitor events
// potential refactor will have a main script that requires both client socket files

// for this file, here are our test priorities:
// basic data flow:
// 1) open Room(s) [note: at this writing, we are opening a Room in this code (as apposed to using roomClientSocket.js)]
// 2) warn Room
// Result: room will see a warning, and Visitor will see acknowledgement of warning receipt

// other tests include testing for multiple Visitor alerts and Room pending warnings
const SHOW = 0;
const io = require('socket.io-client');

const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
// const bold = clc.bold;

const { getNow, printJson, socketIoServerUrl } = require('./helpers');

const TESTING = 1;
console.log(highlight(getNow(), 'Starting visitorClientSocket.js'));
console.log(TESTING ? 'Testing' : 'Production');
//#endregion Preamble

//#region Room events
const leaveRoom = (clientSocket, message) => {
  clientSocket.emit('leaveRoom', message, (ack) => {
    console.group('Server Acknowledged: Leave Room:');
    console.log(success(ack));
    console.groupEnd();
  });
};

// tested 10.13.20
const enterRoom = (clientSocket, message) => {
  clientSocket.emit('enterRoom', message, (ack) => {
    console.group(`[${getNow()}] Server Acknowledged: Enter Room:`);
    console.log(ack);
    console.groupEnd();
  });
};

// general purpose event handler for clients
const exposeEventPromise = function(clientSocket, event) {
  return new Promise(function(resolve) {
    clientSocket.emit(event, null, (results) => {
      resolve(results);
    });
  });
};

//                     EVENT CONSOLE LOGS                            //
// these calls do not return values to the caller
const exposeOpenRooms = (clientSocket) => {
  clientSocket.emit('exposeOpenRooms', null, (rooms) => {
    console.groupCollapsed('All Rooms:');
    console.log(printJson(rooms));
    console.groupEnd();
  });
};

// consider using all Sockets as a way to elminate other events/functions
const exposeAllSockets = (clientSocket) => {
  clientSocket.emit('exposeAllSockets', null, (sockets) => {
    console.groupCollapsed('All Sockets:');
    console.log(printJson(sockets));
    console.groupEnd();
  });
};

const exposeAvailableRooms = (clientSocket) => {
  clientSocket.emit('exposeAvailableRooms', null, (rooms) => {
    console.groupCollapsed('Available Rooms:');
    console.log(printJson(rooms));
    console.groupEnd();
  });
};

const exposeOccupiedRooms = (clientSocket) => {
  clientSocket.emit('exposeOccupiedRooms', null, (rooms) => {
    console.groupCollapsed('Occupied Rooms:');
    console.log(printJson(rooms));
    console.groupEnd();
  });
};

const exposePendingRooms = (clientSocket) => {
  clientSocket.emit('exposePendingWarnings', null, (rooms) => {
    console.groupCollapsed('Pending Rooms:');
    console.log(printJson(rooms));
    console.groupEnd();
  });
};

const exposeVisitorsRooms = (clientSocket) => {
  clientSocket.emit('exposeVisitorsRooms', null, (rooms) => {
    console.groupCollapsed('Visitors Rooms:');
    console.log(printJson(rooms));
    console.groupEnd();
  });
};

// tested 10.12.20
const exposureWarning = (clientSocket, message, cb) => {
  TESTING && console.table(message);
  clientSocket.emit('exposureWarning', message, (ack) => {
    console.groupCollapsed(
      `[${getNow()}] Client:  emitting exposureWarning, Server Acknowledged:`
    );
    console.log(ack.result ? success(printJson(ack)) : error(printJson(ack)));
    console.groupEnd();

    // if some other code wants to see this result, pass it in the callback
    // we should explore using Promises, instead...
    if (cb) {
      cb(ack);
    }
  });
};
//#endregion                            //

//#region  Room named listeners
// using named listeners makes it easier to remove listeners from socket event handlers

// tested 10.12.20
const onAvailableRoomsExposed = (message) => {
  console.groupCollapsed('onAvailableRoomsExposed results:');
  console.table(message);
  console.groupEnd();
};

// tested 10.12.20
const onExposureAlert = (message) => {
  console.log('onAllSocketsExposed results:');
  console.log(error('ALERT:', message));
};

// tested 10.13.20
const onAllRoomsExposed = (message) => {
  console.log(info('Tested ', getNow()));
  console.groupCollapsed('onAllRoomsExposed results:');
  console.table(message);
  console.groupEnd();
};

const onAllSocketsExposed = (message) => {
  console.groupCollapsed('onAllSocketsExposed results:');
  console.table(message);
  console.groupEnd();
};

const onPendingRoomsExposed = (list = ['No Rooms are online right now.']) => {
  console.groupCollapsed('onPendingRoomsExposed results:');
  console.table(list);
  console.groupEnd();
};

//#endregion Listeners

////////////////////////////////////////////////////////////////////////////////////////////
//#region  Client Socket Event handlers

function openVisitorConnection(query) {
  try {
    const connectionMap = new Map();

    const clientSocket = io(socketIoServerUrl, {
      query: query,
    });

    // these are the sockets options in the Visitor.vue
    clientSocket.on('connect', () => {
      connectionMap.set(clientSocket.query.visitor, clientSocket);
      console.groupCollapsed(`[${getNow()}] openVisitorConnection results:`);
      console.log(
        success(
          `On ${getNow()}, ${clientSocket.query.visitor} is on socket ${
            clientSocket.id
          }`
        )
      );
      console.groupEnd();
    });

    clientSocket.once('connect_error', (message) => {
      switch (message.type) {
        case 'TransportError':
          if (SHOW) {
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
          }
          break;
      }
    });

    // TODO: move these event handler details to listeners pattern
    // I believe action is necessary here only if the query options have to change (which they don't)
    clientSocket.on('reconnect_attempt', () => {
      if (SHOW) {
        console.log(warn(`Attempting to reconnect clientSocket:`));
        console.table(clientSocket.io.opts.query);
      }
      // let x = visitor.filter(
      //   (v) =>
      //     (v.name == clientSocket.io.opts.query.visitor) |
      //     clientSocket.io.opts.query.room
      // );
      // clientSocket.io.opts.query = x;
    });

    clientSocket.on('pendingRoomsExposed', onPendingRoomsExposed);

    clientSocket.on('availableRoomsExposed', onAvailableRoomsExposed);

    clientSocket.on('allRoomsExposed', onAllRoomsExposed);

    clientSocket.on('allSocketsExposed', onAllSocketsExposed);

    clientSocket.on('exposureAlert', onExposureAlert);

    clientSocket.on('updatedOccupancy', (message) => {
      console.log(
        success(`${message.room} occupancy is now ${message.occupancy}`)
      );
    });

    return clientSocket;
  } catch (err) {
    console.log(error('Cannot find the socket.io server.'));
  }
}
//#endregion Client Socket event handlers

module.exports = {
  openVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeOpenRooms,
  exposeEventPromise,
  exposeAllSockets,
  exposeAvailableRooms,
  exposeOccupiedRooms,
  exposePendingRooms,
  exposeVisitorsRooms,
  leaveRoom,
};
