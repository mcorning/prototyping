// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// io.VisitorSocket event acknowledgements return state change
// state change is basis of assertions
console.clear();
// require('./oracle')
const { fire, addTestMessage, log, getNow, report } = require('./helpers');
const { pickVisitor } = require('./visitorData.js');
const { pickRoom } = require('./roomData.js');

// const moment = require('moment');

const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const DEBUG = 0; // use this to control some log spew

console.log(DEBUG ? 'Debugging enabled' : '');

// this socket permits us to see broadcast messages to a namespace
// don't forget the {}
// otherwise js won't interpret the reference as the funtion it is in roomClientSocket.js
const {
  OpenRoomConnection,
  alertVisitor,
  closeRoom,
  exposeOccupiedRooms,
  openRoom,
} = require('./roomClientSocket');
const {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeAvailableRooms,
  leaveRoom,
} = require('./visitorClientSocket');

// NOTE: if you manually disconnect these sockets, you won't see any results
// from the server after the run() method finishes
let roomSocket = OpenRoomConnection('RoomAdmin');
let visitorSocket = OpenVisitorConnection('VisitorAdmin');

exposeAvailableRooms(roomSocket);

let visitorsToTest = 1;
let testCount = 3;
let availableRooms = new Map();

// entry point for state machine is inside socket.io connect event handler
visitorSocket.on('connect', () => {
  console.log(visitorSocket.id);
  run();
});

roomSocket.on('connect', () => {
  console.log(roomSocket.id);

  console.log(highlight('Admin', 'Connection open'));
});

//
// // visitorSocket.on('checkIn', (message) =>
// roomSocket.on('checkIn', (message) =>
//   console.log(
//     success(
//       `${message.visitor} ${message.message} ${message.room} on ${moment(
//         message.sentTime
//       ).format('lll')}`
//     )
//   )
// );

// // this test is driven from the socket.io server (when enabled)
// roomSocket.on('exposureAlert', (alertMessage) =>
//   console.log(error('ALERT:', alertMessage))
// );

// end of server-driven test

// base class
const Visitor = function(name, rooms, transitions) {
  this.name = name;
  this.rooms = rooms;
  this.enabledTransitionsFor = new Map(transitions);
  this.room = pickRoom();
  console.log('\nTests left:', testCount, 'at', getNow());
  console.log(highlight('Visitor :>> ', this.name));
  console.log(notice('Chosen Room :>> ', this.room.name));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Connect after setting all properties and methods a Visitor will need
  this.currentState = new Connect(this);

  this.change = function(state) {
    // limits number of changes
    if (!visitorsToTest--) {
      return;
    }
    this.currentState = state;
    this.currentState.fireTransition();
  };

  this.start = function() {
    this.currentState.fireTransition();
  };
};

// State/Transition functions

const Connect = function(visitor) {
  this.visitor = visitor;

  // ensure one or more Rooms are open
  roomSocket.emit('openRoom', pickRoom(), (ack) => {
    console.group('Inside Connect: Server Acknowledged: Open Room:');
    availableRooms.set(ack.name, ack.id);
    console.log([...availableRooms]);
    console.log(success(ack.msg));
    console.groupEnd();
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

const WarnRooms = function(visitor) {
  this.visitor = visitor;
  const { name, room } = visitor;
  console.log(warn('Warning room(s)', room));
  const warnings = {};
  // these dates have to be based on previously run test with their random visiting dates
  warnings[room] = [
    '2020-09-19T00:33:04.248Z',
    '2020-09-19T00:35:38.078Z',
    '2020-09-14T02:53:33.738Z',
    '2020-09-18T02:53:35.050Z',
  ];
  const msg = {
    sentTime: new Date().toISOString(),
    visitor: name,
    warnings: warnings,
  };
  visitorSocket.emit('exposureWarning', msg, (ack) => {
    ack.slice(0, 7) == 'WARNING'
      ? console.log(error(ack))
      : console.log(warn(ack));
  });

  this.fireTransition = function() {
    fire(visitor);
    visitorSocket.emit('disconnect');
  };
};

const EnterRoom = function(visitor) {
  this.visitor = visitor;

  const { name, room } = visitor;

  const msg = addTestMessage(name, room);

  // open the Room if necessary
  report(
    'Enter Room Transition Data:',
    visitor.visitor,
    visitorSocket.id,
    room,
    roomSocket.id
  );

  openRoom(roomSocket, room);

  enterRoom(visitorSocket, msg);

  this.fireTransition = function() {
    fire(visitor);
  };
};

// leave/change Room(s), but stay online
const LeaveRoom = function(visitor) {
  this.visitor = visitor;
  const { name, room } = visitor;

  const msg = {
    room: room,
    visitor: name,
    message: 'Leave',
    sentTime: new Date().toISOString(),
  };
  visitorSocket.emit('leaveRoom', msg, (ack) => {
    console.group('Server Acknowledged: Leave Room:');
    console.log(success(ack));
    console.groupEnd();
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

// disconnect from server (e.g., shut down browser)
const Disconnect = function(visitor) {
  this.visitor = visitor;

  this.fireTransition = function() {
    fire(visitor);
    visitorSocket.emit('disconnect');
  };
};

// model properties

const EnterRoomTransition = (visitor) => new EnterRoom(visitor);
const LeaveRoomTransition = (visitor) => new LeaveRoom(visitor);
const DisconnectTransition = (visitor) => new Disconnect(visitor);
const WarnRoomsTransition = (visitor) => new WarnRooms(visitor);

// these are emit method options in the Visitor.vue (as opposed the sockets on event handler options)
const transitions = [
  ['Connect', [[EnterRoomTransition, WarnRoomsTransition], 1.0, 0.0]],
  [
    'EnterRoom',
    [
      [LeaveRoomTransition, DisconnectTransition, WarnRoomsTransition],
      1,
      0.0,
      0.0,
    ],
  ],
  ['LeaveRoom', [[DisconnectTransition, EnterRoomTransition], 1, 0]],
  ['WarnRooms', [[], 1]],
  ['Disconnect', [[], 1]],
];
// end model properties

function run() {
  console.time('Tests ran');
  const rooms = ['Heathlands.Medical', 'ABMS.Medical', 'Heathlands.Cafe'];
  do {
    const visitor = new Visitor(pickVisitor(), rooms, transitions);
    visitor.start();
    testCount -= 1;
  } while (testCount >= 0);
  console.group('Tests Complete');
  console.timeEnd('Tests ran');

  console.log(success('Test complete'));

  console.log('Test Results Log:');
  log.show();
  console.groupEnd();

  return;
}
