// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// io.VisitorSocket event acknowledgements return state change
// state change is basis of assertions
console.clear();
// require('./oracle')
const { fire, addTestMessage, log, getNow, report } = require('./helpers');
const { pickVisitor, visitors, messages } = require('./visitorData.js');
const { pickRoom, rooms } = require('./roomData.js');

// const moment = require('moment');

const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

const TESTING = 0; // use this to control some log spew
let testCount = 0; // zero-based, so 0 is for single test
let visitorsToTest = 1;
let availableRooms = new Map();
console.log(highlight(getNow(), 'Starting visitorStateMachine.js'));
console.log(TESTING ? 'TESTING' : 'PRODUCTION');

// this socket permits us to see broadcast messages to a namespace
// don't forget the {}
// otherwise js won't interpret the reference as the funtion it is in roomClientSocket.js
const {
  OpenRoomConnection,
  // alertVisitor,
  // closeRoom,
  // exposeOccupiedRooms,
  openRoom,
} = require('./roomClientSocket');
const {
  OpenVisitorConnection,
  // exposureWarning,
  enterRoom,
  exposeAvailableRooms,
  // leaveRoom,
} = require('./visitorClientSocket');

// NOTE: if you manually disconnect these sockets, you won't see any results
// from the server after the run() method finishes
// since Room and Visitor are objects now pick one of each here (not later)
const roomSocket = OpenRoomConnection(pickRoom(rooms));
const ROOM = roomSocket.query;

function thisVisitor(visitors) {
  return visitors.reduce((a, c) => {
    if (c.visitor == 'AirGas Inc') {
      a = c;
      return a;
    }
  }, {});
}

const visitor = pickVisitor(thisVisitor);

console.log('visitor:');
console.table(visitor);
const visitorSocket = OpenVisitorConnection(visitor);
const VISITOR = visitorSocket.query;
console.table(VISITOR);

// MODEL ENTRY POINT
// for state machine is inside socket.io connect event handler
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
const Visitor = function(visitor, room, transitions) {
  this.name = visitor.visitor;
  this.enabledTransitionsFor = new Map(transitions);
  console.log('\nTests left:', testCount, 'at', getNow());
  console.log(highlight('Visitor :>> ', this.name));
  console.log(notice('Chosen Room :>> ', room.room));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Mu after setting all properties and methods a Visitor will need
  this.currentState = new Mu(this);

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

// Mu state is where Visitor is enabled to do something, but is not yet committed to anything.
// this state enables more transitions than any other state.
const Mu = function(visitor) {
  this.visitor = visitor;

  // ensure one or more Rooms are open
  roomSocket.emit('openRoom', ROOM, (ack) => {
    console.group('Inside Mu: Server Acknowledged: Open Room:');
    availableRooms.set(ack.name, ack.id);
    console.log(success(ack.msg));
    console.groupEnd();
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

const OccupyingRoom = function(visitor) {
  this.visitor = visitor;

  report(
    'Enter Room Transition Data:',
    visitor.name,
    visitorSocket.id,
    ROOM.room,
    roomSocket.id
  );

  openRoom(roomSocket, ROOM);

  const msg = addTestMessage(VISITOR, ROOM);
  enterRoom(visitorSocket, msg);

  this.fireTransition = function() {
    fire(visitor);
  };
};

const VisitorWarned = function(visitor) {
  this.visitor = visitor;
  console.log(warn('Warning room(s)', ROOM.room));
  const dates = messages.filter((v) => v.visitor.visitor == visitor);
  const warnings = [
    {
      room: ROOM.room,
      id: ROOM.id,
      dates: dates,
    },
  ];
  const msg = {
    sentTime: new Date().toISOString(),
    visitor: VISITOR,
    warnings: warnings,
  };
  console.log('msg:');
  console.table(msg);

  // how is this different than using exposureWarning()?
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

//NOTE:
// if we now go to Mu state instead of leftRoom state, how do we handle leaveRoom on the server?

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
const Disconnected = function(visitor) {
  this.visitor = visitor;

  this.fireTransition = function() {
    fire(visitor);
    visitorSocket.emit('disconnect');
  };
};

// model properties

const ToOccupyingRoom = (visitor) => new OccupyingRoom(visitor);
const ToMu = (visitor) => new Mu(visitor);
const ToDisconnected = (visitor) => new Disconnected(visitor);
const ToQuarantined = (visitor) => new VisitorWarned(visitor); // no way out of quarantine

// these are emit method options in the Visitor.vue (as opposed the sockets on event handler options)
// first element is State. internal array are available Transitions for the State)
const transitions = [
  ['Mu', [[ToOccupyingRoom, ToQuarantined], 0.5, 0.5]],
  ['OccupyingRoom', [[ToDisconnected, ToMu, ToQuarantined], 1.0, 0, 0.0]],
  ['VisitorWarned', [[], 1]],
  ['Disconnected', [[], 1]],
];
// end model properties

function run() {
  console.time('Tests ran');
  do {
    const visitor = new Visitor(VISITOR, ROOM, transitions);
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
