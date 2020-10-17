/* Scenarios:
The app starts in one of two states: new or used. Actually, mu is more accurate than new.
On the Room vue, once a Room name is given, a socket opens witht eht Room query to stipulate the name, id, and selected (default) namespace.
Exactly the same thing happens on the Visitor vue, but it's Visitor socket with a Visitor query.
If the Visitor name is an email address, the socket has an Admin query that gives the socket unlimited access to server state and activity across namespaces

This file tests all Visitors events, listeners, and functions. 
The roomClientSocket.Test.js file handles Rooms.
The LCT State Machine handles both simultaneously.

These tests follow the actual flow of data in the namespace.
Nothing happens in the namespace until at least one Room is online.

Each test passes a connectionMap to the next test.
*/

const clc = require('cli-color');
const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
const info = clc.cyan;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const { getNow } = require('./helpers');

const {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  // exposeAllRooms,
  // exposeAllSockets,
  // exposeAvailableRooms,
  exposePendingRooms,
  leaveRoom,
} = require('./visitorClientSocket');
const {
  // getExposures,
  getWarnings,
  groupBy,
  messages,
  pickVisitor,
  visitors,
} = require('./visitorData');

const {
  OpenRoomConnection,
  openRoom,
  // alertVisitor,
} = require('./roomClientSocket');
const { pickRoom, rooms } = require('./roomData');

console.log(highlight(getNow(), 'Starting visitorClientSocket.Test.js'));

async function testOpenRoomConnection() {
  const getConnections = new Promise(function(resolve) {
    let connectionMap = new Map();

    let room = pickRoom(rooms);
    // 1) Open Room
    let roomSocket = OpenRoomConnection(room);
    roomSocket.on('connect', () => {
      // open Room with every connection to ensure pendingWarnings get sent
      openRoom(roomSocket, room);
      connectionMap.set(roomSocket.query.room, roomSocket);
      resolve(connectionMap);
    });
  });
  return await getConnections;
}

async function testOpenVisitorConnection(connectionMap) {
  // make connection map from some or all cached Visitor data
  const getConnections = new Promise(function(resolve) {
    let vs = visitors.filter((v, i) => i == 2);
    let more = vs.length;
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

  return await getConnections;
}

async function testLeaveRoom(message) {
  let visitorSocket = message.visitor;
  leaveRoom(visitorSocket, {
    visitor: message.visitor.query,
    room: message.room.query,
    sentTime: new Date().toISOString(),
    message: 'Leave',
  });
}

async function testExposureWarning(connectionMap) {
  // visitor warns  room
  // since we only have a Map and no separate record of names, convert the Map to an array
  const socket = getVisitorSocket(connectionMap);
  // Example message:
  // {
  //    sentTime:'2020-09-19T00:56:54.570Z',
  //    visitor:{visitor:'Nurse Jackie', id:'FWzLl5dS9sr9FxDsAAAB', nsp:'enduringNet'},
  //    warnings:{
  //       Heathlands.Medical:[
  //         '2020-09-19T00:33:04.248Z', '2020-09-14T02:53:33.738Z', '2020-09-18T07:15:00.00Z'
  //       ]
  //    }
  // };

  let message = {
    sentTime: new Date().toISOString(),
    visitor: socket.query,
    warnings: getWarnings(socket.query.id),
  };
  exposureWarning(socket, message);
  exposePendingRooms(socket);
}

function getVisitorSocket(connectionMap) {
  let visitors = [...connectionMap]
    .map((v) => v[1])
    .filter((v) => v.query.visitor);
  let visitorName = pickVisitor(visitors).query.visitor;
  return connectionMap.get(visitorName);
}
async function testEnterRoom(connectionMap) {
  let visitorSocket = getVisitorSocket(connectionMap);

  let rooms = [...connectionMap].map((v) => v[1]).filter((v) => v.query.room);
  let roomName = pickRoom(rooms).query.room;
  let roomSocket = connectionMap.get(roomName);

  const message = {
    visitor: visitorSocket.query,
    room: roomSocket.query,
    message: 'Entered',
    sentTime: new Date().toISOString(),
  };
  enterRoom(visitorSocket, message);

  // at this point, we don't need the connectionMap anymore.
  // from now on, we use the active Visitor and Room sockets.
  return { visitor: visitorSocket, room: roomSocket };
}

async function report(results) {
  console.log(
    success('=======================================================')
  );
  console.log(success(bold('Successful test of EnterRoom on', getNow())));
  console.log(
    success(
      '\t',
      results.visitor.query.visitor,
      'entered',
      results.room.query.room
    )
  );
  console.log(info('See detail below: Server Acknowledged: Enter Room:'));
  console.log(
    success('=======================================================')
  );
  // pass on the input to the next stage of processing the scenario...
  return results;
}

let INCLUDE = 0;

INCLUDE &&
  testOpenRoomConnection()
    .then((connectionMap) => testOpenVisitorConnection(connectionMap))
    .then((connectionMap) => testEnterRoom(connectionMap))
    .then((results) => report(results))
    .then((results) => testLeaveRoom(results))
    .then(() => console.log(notice('success')));

testOpenRoomConnection()
  .then((connectionMap) => testOpenVisitorConnection(connectionMap))
  .then((connectionMap) => testExposureWarning(connectionMap));
