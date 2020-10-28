const SHOW = 0;
const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
// const bold = clc.bold;

const {
  getNow,
  groupMessagesByDateAndVisitor,
  logResults,
  socketIoServerUrl,
} = require('./helpers');
const { messages, printJson } = require('./helpersRoom');
const { rooms } = require('./roomData.js');

// const INCLUDE = 0;
let TESTING = 1;
console.log(highlight(getNow(), 'Starting roomClientSocket.js'));
console.log(TESTING ? 'Testing' : 'Production');

// methods called by state machine or test code
const alertVisitor = (clientSocket, visitor, warning) => {
  const message = {
    visitor: visitor,
    message: `${warning}. To stop the spread, self-quarantine for 14 days.`,
    sentTime: new Date().toISOString(),
  };
  clientSocket.emit('alertVisitor', message, (rooms) => {
    console.log('Available Rooms:');
    console.table(rooms);
  });
};

const closeRoom = (clientSocket, message) => {
  clientSocket.emit('closeRoom', message, (rooms) => {
    console.log('Available Rooms:');
    console.table(rooms);
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

// message is a room query
const openRoom = (clientSocket, message) => {
  clientSocket.emit('openRoom', message, (ack) => {
    console.groupCollapsed(
      `[${getNow()}] Client: emitting openRoom, Server Acknowledged:`
    );

    console.log(ack.result ? success(printJson(ack)) : error(printJson(ack)));
    console.groupEnd();
  });
};
// end methods called by state machine

// listeners
// using named listeners makes it easier to remove listeners from socket event handlers
const onAvailableRoomsExposed = (message) => {
  console.groupCollapsed(`${getNow()} onAvailableRoomsExposed results:`);
  console.table(message);
  console.groupEnd();
};

const onCheckIn = (message) => {
  console.groupCollapsed('EnterRoom/CheckIn:');
  console.log(success('Results:', printJson(message)));
  console.groupEnd();
};

const onCheckOut = (message) => {
  console.groupCollapsed('LeaveRoom/CheckOut:');
  console.log(success('Results:', printJson(message)));
  console.groupEnd();
};

// can't find a way to use this listener...yet
const onNotifyRoom = (data, ack) => {
  const { exposureDates, room, visitor, roomMap } = data;
  console.groupCollapsed('In onNotifyRoom:');
  console.table(data);
  let messageDates = groupMessagesByDateAndVisitor({
    array: messages,
    prop: 'sentTime',
    val: 'visitor',
  });
  console.table(messageDates);
  exposureDates.forEach((date) => {
    // list all visitors on this date
    messageDates[date].forEach((other) => {
      if (other.visitor == visitor.visitor) {
        console.log(
          `${visitor.visitor}, we sent an exposure alert to another occupant in ${room} on ${date}`
        );
      } else {
        console.log(`${other.visitor} was in ${room} on ${date}`);
        let warning = {
          visitor: other.visitor,
          message: `${other.visitor}. To stop the spread, self-quarantine for 14 days.`,
          sentTime: new Date().toISOString(),
        };
        const socket = roomMap.get(room);
        console.log(socket.connected);
        socket.emit('alertVisitor', warning, (result) => {
          console.log(result);
        });
      }
    });
  });
  console.groupEnd();

  if (ack) ack(`${visitor.visitor}, ${room} alerted`);
};

const onNotifyRoomX = (data, ack) => {
  // data can be on object or an array
  // const { exposureDates, room, visitor } = data.length ? data[0] : data;
  // let messageDates = groupMessagesByDateAndVisitor({
  //   array: messages,
  //   prop: 'sentTime',
  //   val: 'visitor',
  // });
  // if (!Object.keys(messageDates).length) {
  //   alert(
  //     'UNEXEPECTED STATE: \nThere should be messages from the alerting Visitor.'
  //   );
  //   return;
  // }
  // console.groupCollapsed('In onNotifyRoom:');
  // console.table(data);
  // console.log(info('messageDates include:'));
  // console.log(printJson(messageDates));
  // let alerts = new Map();
  // // if only a single incoming date, make a Set with that
  // // otherwise use the object for the Set
  // let exposureDatesSet =
  //   typeof exposureDates == 'string'
  //     ? new Set().add(exposureDates)
  //     : new Set(exposureDates);
  // console.group('Alerts');
  // console.log('Alert Dates', printJson(exposureDatesSet));
  // console.log('Here are the necessary Exposure Alerts');
  // exposureDatesSet.forEach((date) => {
  //   messageDates[moment(date.sentTime).format('YYYY-MM-DD')].forEach((v) => {
  //     let phrase =
  //       v.visitor != visitor
  //         ? 'BE ADVISED: you may have been exposed to the virus'
  //         : 'CONFIRMING: you may have exposed others to the virus';
  //     let msg = `${v.visitor}, ${phrase} on date(s): ${moment(
  //       date.sentTime
  //     ).format('llll')}`;
  //     let alert = alerts.get(v.visitor);
  //     alerts.set(
  //       v.visitor,
  //       alert ? alert.concat(`, ${moment(date).format('llll')}`) : msg
  //     );
  //   });
  // });
  // console.groupEnd();
  // // iterate the Map and emit alertVisitor event
  // // Server will ensure a Visitor is online before forwarding event
  // // otherwise, cache Visitor until they login again
  // for (let [key, value] of alerts.entries()) {
  //   let message = {
  //     visitor: key,
  //     message: `${value}. To stop the spread, self-quarantine for 14 days.`,
  //     sentTime: new Date().toISOString(),
  //   };
  //   const socket = OpenRoomConnection(data.room);
  //   socket.on('connect', () => {
  //     socket.emit('alertVisitor', message, (ack) => {
  //       logResults.add(ack, 'alert');
  //     });
  //   });
  // }
  // if (ack) ack(`${visitor}, ${room} alerted`);
  // console.groupEnd();
};
// end listeners

////////////////////////////////////////////////////////////////////////////////////////////
// Client Socket Event handlers

// these match the sockets options in the Room.vue
// but they are called by state machine on behalf of the Room.vue
// room is an object {name, id, nsp}
function OpenRoomConnection(query) {
  try {
    let roomMap = new Map();
    const clientSocket = io(socketIoServerUrl, {
      query: query,
    });

    // NOTE: this on connect handler does things that the caller's
    // on connect handler for roomSocket (which has the same socket id) does not
    clientSocket.once('connect', () => {
      roomMap.set(clientSocket.query.id, clientSocket);
      console.groupCollapsed(`[${getNow()}] OpenRoomConnection results:`);
      console.log(success(printJson({ table: clientSocket.query })));
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

        default:
          if (SHOW) {
            console.log(error('Unhandled connection error:'));
            console.log(error(message.message));
          }
      }
    });

    // specialized event handlers
    clientSocket.on('checkIn', onCheckIn);

    clientSocket.on('checkOut', onCheckOut);

    // once event handler minimizes the number of times this socket handles an event
    clientSocket.once('availableRoomsExposed', onAvailableRoomsExposed);

    // onNotifyRoom:
    // called by exposureWarning event handler on server
    // server calls each affected Room to spread alert to other Visitors
    // data param object:
    //  data: {
    //    visitor: visitor,
    //    exposureDates: exposureDates, // based on warning param input to exposureWarning
    //    room: room,
    //  },
    clientSocket.on('notifyRoom', (data, ack) => {
      const { exposureDates, room, visitor } = data;
      console.groupCollapsed(
        `[${getNow()}] Room Client: onNotifyRoom, Server Acknowledged:`
      );
      console.log('Input data:');
      console.table(data);
      let messageDates = groupMessagesByDateAndVisitor({
        array: messages,
        prop: 'sentTime',
        val: 'visitor',
      });
      console.log(`Room's grouped messages:`);
      console.table(messageDates);
      exposureDates.forEach((date) => {
        // list all visitors on this date
        messageDates[date].forEach((other) => {
          if (other.visitor == visitor.visitor) {
            console.log(
              `${visitor.visitor}, we sent an exposure alert to another occupant in ${room} on ${date}`
            );
          } else {
            console.log(
              `Alerting ${other.visitor} that they were in ${room} on ${date}`
            );
            let warning = {
              visitor: other.visitor,
              id: other.id,
              message: `${other.visitor}. To stop the spread, self-quarantine for 14 days.`,
              sentTime: new Date().toISOString(),
            };
            // roomMap is declared at the top of this function
            // making it unavailable outside this function (e.g., to listeners)
            const socket = roomMap.get(room);
            console.log(`Socket ${socket.id} connected? ${socket.connected}`);
            socket.emit('alertVisitor', warning, (result) => {
              console.log(result);
            });
          }
        });
      });
      console.groupEnd();

      if (ack) ack(`${visitor.visitor}, ${room} alerted`);
    });

    // namespace broadcast event handlers
    // e.g., on server:     io.of(namespace).emit('updatedOccupancy')
    // clientSocket.on('updatedOccupancy', (message) => {
    //   console.log(
    //     success(`${message.room} occupancy is now ${message.occupancy}`)
    //   );
    // });

    return clientSocket;
  } catch (error) {
    console.error('OpenRoomConnection hit this:', error);
  }
}
// end specialized event handlers

module.exports = {
  OpenRoomConnection,
  alertVisitor,
  closeRoom,
  exposeAvailableRooms,
  exposeOccupiedRooms,
  openRoom,
};

TESTING = 0;
async function bvt() {
  // test helpers
  var getConnections = new Promise(function(resolve) {
    let connectionMap = new Map();
    let rs = rooms;
    let more = rooms.length;
    rs.forEach((room) => {
      let socket = OpenRoomConnection(room);
      socket.on('connect', () => {
        connectionMap.set(socket.query.room, socket);
        if (!--more) {
          resolve(connectionMap);
        }
      });
      exposeAvailableRooms(socket);
    });
  });

  return await getConnections;
}

TESTING &&
  bvt().then((c) => {
    console.log(info('connectionMap:'));
    console.table(c);
  });
