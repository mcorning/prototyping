// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// io.VisitorSocket event acknowledgements return state change
// state change is basis of assertions
console.clear();
// require('./oracle')
const {
  fire,
  addTestMessage,
  getNow,
  groupMessagesByDateAndRoom,
  groupMessagesByRoomAndDate,
  report,
  logResults,
} = require('./helpers');
const { pickVisitor, groupBy, messages } = require('./visitorData.js');
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
let testCount = 2;
let visitorsToTest = 1;
let availableRooms = new Map();
console.log(highlight(getNow(), 'Starting visitorStateMachine.js'));
console.log(TESTING ? 'TESTING' : 'PRODUCTION');

// this socket permits us to see broadcast messages to a namespace
// don't forget the {}
// otherwise js won't interpret the reference as the funtion it is in roomClientSocket.js
const {
  OpenRoomConnection,
  alertVisitor,
  // closeRoom,
  // exposeOccupiedRooms,
  openRoom,
} = require('./roomClientSocket');
const {
  OpenVisitorConnection,
  exposureWarning,
  enterRoom,
  exposeAvailableRooms,
  // leaveRoom,
} = require('./visitorClientSocket');

// NOTE: if you manually disconnect these sockets, you won't see any results
// from the server after the run() method finishes
// since Room and Visitor are objects now pick one of each here (not later)
const roomSocket = OpenRoomConnection(pickRoom(rooms));
const ROOM = roomSocket.query;
logResults.entitle('Visitor State Machine Test Results');

console.groupCollapsed('Found Visitor');
function visitorHoF(visitors) {
  const visitor = visitors.reduce((a, c, i, v) => {
    if (c.visitor == 'AirGas Inc') {
      logResults.add('Found', v[i]);
      a = c; // update accumulator because we're about to modify vivisors array
      v = v.splice(1); // changing the array will end the iteration
      return a;
    }
  }, {});
  return visitor;
}

const visitor = pickVisitor(visitorHoF);

const visitorSocket = OpenVisitorConnection(visitor);
const VISITOR = visitorSocket.query;
console.table(VISITOR);
console.groupEnd();

// MODEL ENTRY POINT
// for state machine is inside socket.io connect event handler
visitorSocket.on('connect', () => {
  TESTING &&
    visitorSocket.emit('exposureWarning', '', (msg) => {
      console.log('visitorSocket', msg);
    });
  TESTING &&
    exposureWarning(visitorSocket, '', (msg) => console.log('sm', msg));

  !TESTING && run();
});

roomSocket.on('connect', () => {
  TESTING &&
    roomSocket.emit('alertVisitor', '', (msg) => {
      console.log('roomSocket', msg);
    });
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
  this.id = visitor.id;
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
// Alternate Preconditions: AppOpen or OccupyingRoom
// Input Transitions: connect or leaveRoom
// Output Transitions: warnVisitor, visitorWarns, enterRoom, disconnect
// Postconditions: VisitorQuarantined, VisitorQuarantined
// Paths:
//    AppOpen ->connect->Mu->enterRoom->OccupyingRoom->leaveRoom
//    AppOpen ->connect->Mu->disconnect
//    AppOpen ->connect->Mu->visitorWarns->VisitorQuarantined
//    AppOpen ->connect->Mu->warnVisitor->VisitorWarned->visitorWarns
//
const Mu = function(visitor) {
  this.visitor = visitor;

  // ensure one or more Rooms are open
  roomSocket.emit('openRoom', ROOM, (ack) => {
    console.group('Inside Mu: Server Acknowledged: Open Room:');
    availableRooms.set(ack.name, ack.id);
    console.log(success(ack.msg));
    console.groupEnd();
    logResults.add(`openRoom ack: ${ack}`);
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

// this state occurs when the Visitor enters a Room and the Room has an alert waiting for them
// Preconditions: PendingWarning and Mu
// Transition: WarnVisitor
// postcondition: this is a terminal condition
const VisitorQuarantined = function(visitor) {
  this.visitor = visitor;

  let payload = {
    array: messages.filter((v) => v.visitor.id == visitor.id),
    prop: 'room',
    val: 'sentTime',
  };
  const msg = {
    sentTime: new Date().toISOString(),
    visitor: VISITOR,
    warnings: groupMessagesByRoomAndDate(payload),
  };

  console.groupCollapsed('Warning visited Room(s)');

  console.log('Warnings:');
  console.table(msg, ['sentTime', 'visitor']);
  console.table(msg, ['warnings']);

  // event sent to Server
  // handled by onExposureWarning()
  exposureWarning(visitorSocket, msg, (ack) => {
    console.log(
      ack.reduce((a, c) => {
        a = `${a} ${c}`;
        return a;
      })
    );
  });

  this.fireTransition = function() {
    fire(visitor);
    visitorSocket.emit('disconnect');
  };
  console.groupEnd();
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
const ToQuarantined = (visitor) => new VisitorQuarantined(visitor); // no way out of quarantine

// these are emit method options in the Visitor.vue (as opposed the sockets on event handler options)
// first element is State. internal array are available Transitions for the State)
const transitions = [
  ['Mu', [[ToOccupyingRoom, ToQuarantined], 1, 0.0]],
  ['OccupyingRoom', [[ToDisconnected, ToMu, ToQuarantined], 0.0, 0.0, 1.0]],
  ['VisitorQuarantined', [[], 1]],
  ['Disconnected', [[], 1]],
];
// end model properties

function run() {
  console.time('Tests ran');
  do {
    const visitor = new Visitor(VISITOR, ROOM, transitions);
    visitor.start();
  } while (--testCount > 0);
  console.group('Tests Complete');
  console.timeEnd('Tests ran');

  console.log(success('Test complete'));

  console.log('Test Results Log:');
  logResults.show();
  console.groupEnd();

  return;
}
