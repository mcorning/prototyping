const clc = require('cli-color');
const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const { getNow } = require('./helpers');

const {
  OpenVisitorConnection,
  // exposureWarning,
  enterRoom,
  // exposeAllRooms,
  // exposeAllSockets,
  // exposeAvailableRooms,
  leaveRoom,
} = require('./visitorClientSocket');
const {
  getExposures,
  getWarnings,
  pickVisitor,
  visitors,
} = require('./visitorData');

const {
  OpenRoomConnection,
  openRoom,
  // alertVisitor,
} = require('./roomClientSocket');

console.log(highlight(getNow(), 'Starting visitorClientSocket.Test.js'));

async function bvt() {
  // test helpers
  const getConnections = new Promise(function(resolve) {
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
  const addRoomConnection = new Promise(function(resolve) {
    const visitor = pickVisitor();
    let exposures = getExposures(visitor.visitor);

    let room = exposures[0].room;
    // 1) Open Room
    let roomSocket = OpenRoomConnection(room);
    roomSocket.on('connect', () => {
      // open Room with every connection to ensure pendingWarnings get sent
      openRoom(roomSocket, room);
      connectionMap.set(roomSocket.query.room, roomSocket);
      resolve(connectionMap);
    });
  });

  return addRoomConnection;
}

async function testLeaveRoom(message) {
  let visitorSocket = message.visitor;
  leaveRoom(visitorSocket, {
    visitor: message.visitor.query,
    room: message.room.query,
  });
}

async function testEnterRoom(connectionMap) {
  const visitor = pickVisitor();
  let visitorSocket = connectionMap.get(visitor.visitor);
  let roomName = [...connectionMap].reduce((a, c) => {
    if (c[1].query.room) return c[1].query.room;
  }, '');
  let roomSocket = connectionMap.get(roomName);

  // 1) Open Room
  const message = {
    visitor: visitor,
    room: roomSocket.query,
    warnings: getWarnings(visitor.visitor),
    sentTime: new Date().toISOString(),
  };
  // 2) Enter Rooms
  enterRoom(visitorSocket, message);

  return { visitor: visitorSocket, room: roomSocket };
}

bvt()
  .then((connectionMap) => testEnterRoom(connectionMap))
  .then((result) => {
    console.log(
      success('=======================================================')
    );
    console.log(success(bold('Successful test of EnterRoom on', getNow())));
    console.log(
      success(
        '\t',
        result.visitor.query.visitor,
        'entered',
        result.room.query.room
      )
    );
    console.log(info('See detail below: Server Acknowledged: Enter Room:'));
    console.log(
      success('=======================================================')
    );
    return result;
  })
  .then((result) => testLeaveRoom(result))
  .then(() => console.log(success('success')));
