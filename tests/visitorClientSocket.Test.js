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

const SHOW = 0;

const clc = require('cli-color');
const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
const info = clc.cyan;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const { getNow, logResults } = require('./helpers');

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
  getWarning,
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

SHOW &&
  console.log(highlight(getNow(), 'Starting visitorClientSocket.Test.js'));
SHOW && console.log('Creating new Map');
let connectionMap = new Map();

async function testOpenRoomConnection() {
  const getConnections = new Promise(function(resolve) {
    let room = pickRoom(rooms);
    // 1) Open Room
    let roomSocket = OpenRoomConnection(room);
    roomSocket.on('connect', () => {
      logResults.clear();
      logResults.entitle('Testing testOpenRoomConnection...');
      logResults.add({ 'Room Query': roomSocket.query });
      logResults.show();
      // open Room with every connection to ensure pendingWarnings get sent
      openRoom(roomSocket, room);
      connectionMap.set(roomSocket.query.room, roomSocket);
      resolve(connectionMap);
    });
  });
  return await getConnections;
}

// async function testOpenVisitorConnection(connectionMap) {
async function testOpenVisitorConnection() {
  logResults.entitle('Testing OpenVisitorConnection ');
  // make connection map from some or all cached Visitor data
  const getConnections = new Promise(function(resolve) {
    let vs = visitors.filter((v, i) => i == 2);
    let more = vs.length;
    vs.forEach((visitor) => {
      let socket = OpenVisitorConnection(visitor);
      socket.on('connect', () => {
        logResults.add({ socket: socket.id, name: socket.visitor });
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

// async function testExposureWarning(connectionMap) {
async function testExposureWarning() {
  // logResults.start = 'Testing getVisitorSocket()';

  // visitor warns  room
  // since we only have a Map and no separate record of names, convert the Map to an array
  // const socket = getVisitorSocket(connectionMap);
  const socket = getVisitorSocket();
  // WARNING MESSAGE STRUCT:
  //{
  //   sentTime: '2020-09-19T00:56:54.570Z',
  //   visitor: {
  //     visior: 'Nurse Jackie',
  //     id: 'FWzLl5dS9sr9FxDsAAAB',
  //     nsp: 'enduringNet',
  //   },
  //   warning: {              // ONE ROOM PER WARNING
  //     room: {
  //       room: 'Heathlands Medical',
  //       id: 'd6QoVa_JZxnM_0BoAAAA',
  //       nsp: 'enduringNet',
  //     },
  //     dates: [
  //       '2020-09-19T00:33:04.248Z',  // WARNING CAN
  //       '2020-09-14T02:53:33.738Z',  // HAVE MULTIPLE
  //       '2020-09-18T07:15:00.00Z',   // VISIT DATES
  //     ],
  //   },
  // };
  logResults.add({
    step: 'Results from getVisitorSocket()',
    query: socket.json.query,
  });

  let message = {
    sentTime: new Date().toISOString(),
    visitor: socket.query,
    warning: [...getWarning(socket.query.id)],
  };
  logResults.add({
    step: 'Value of message in testExposureWarning:',
    messages: Object.entries(message),
  });

  exposureWarning(socket, message, (ack) => {
    logResults.entitle('Event acknowledgment callback:');
    logResults.add({
      event: 'exposureWarning()',
      ack: ack,
    });
    logResults.show();
  });

  exposePendingRooms(socket);
  // logResults.add(`Results from exposePendingRooms():
  //   what should this be?
  // `);

  return socket;
}

// function getVisitorSocket(connectionMap) {
function getVisitorSocket() {
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
  SHOW &&
    console.log(
      success('=======================================================')
    );
  SHOW &&
    console.log(success(bold('Successful test of EnterRoom on', getNow())));
  SHOW &&
    console.log(
      success(
        '\t',
        results.visitor.query.visitor,
        'entered',
        results.room.query.room
      )
    );
  SHOW &&
    console.log(info('See detail below: Server Acknowledged: Enter Room:'));
  SHOW &&
    console.log(
      success('=======================================================')
    );
  // pass on the input to the next stage of processing the scenario...
  return results;
}

async function testPendingRooms() {
  const socket = getVisitorSocket();
  exposePendingRooms(socket);
  logResults.add({
    step: 'testPendingRooms used socket',
    socket: socket.id,
    name: socket.query.visitor,
  });
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

// for this test, to ensure that warning is PENDING,
// don't open Room connection before opening a Visitor connection.
// then, emit exposureWarning
// finally, check PENDING Rooms
INCLUDE &&
  testOpenVisitorConnection()
    .then(() => testExposureWarning())
    .then(() => testOpenRoomConnection())
    // .then(() => testPendingRooms())
    .then(() => {
      logResults.show();
      console.log(' ');
    });
// this test now checks that pending rooms see warnings
// testOpenRoomConnection();