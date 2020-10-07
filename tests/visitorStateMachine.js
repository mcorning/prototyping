// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// io.VisitorSocket event acknowledgements return state change
// state change is basis of assertions
console.clear();
// require('./oracle')
const { fire, addTestMessage, log } = require('./helpers');
const { pickVisitor } = require('./visitorData.js');
const { pickRoomName } = require('./roomData.js');

const moment = require('moment');

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
const { OpenRoomConnection } = require('./roomClientSocket');
let roomSocket = OpenRoomConnection('Admin');

const { OpenVisitorConnection } = require('./visitorClientSocket');
let visitorSocket = OpenVisitorConnection('Admin');

let countDownFrom = 6;

// entry point for state machine is inside socket.io connect event handler
visitorSocket.on('connect', () => {
  run();
});
roomSocket.on('connect', () => {
  console.log('Admin', 'Connection open');
});

//
visitorSocket.on('checkIn', (message) =>
  console.log(
    success(
      `${message.visitor} ${message.message} ${message.room} on ${moment(
        message.sentTime
      ).format('lll')}`
    )
  )
);

// this test is driven from the socket.io server (when enabled)
visitorSocket.on('exposureAlert', (alertMessage) =>
  console.log(error('ALERT:', alertMessage))
);
// end of server-driven test

// base class
const Visitor = function(name, rooms, transitions) {
  this.name = name;
  this.rooms = rooms;
  this.enabledTransitionsFor = new Map(transitions);
  this.room = pickRoomName();
  this.socket = OpenVisitorConnection(name).open();

  console.log(highlight('Visitor :>> ', this.name));
  console.log(highlight('Visitor Socket.io Client ID:', this.socket.id));
  console.log(notice('Chosen Room :>> ', this.room));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Connect after setting all properties and methods a Visitor will need
  this.currentState = new Connect(this);

  this.change = function(state) {
    // limits number of changes
    if (!countDownFrom--) return;
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

  this.fireTransition = function() {
    fire(visitor);
  };
};

const WarnRooms = function(visitor) {
  this.visitor = visitor;
  const { name, room } = visitor;
  const warnings = {};
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

// const OpenMyRoom = function(visitor) {
//   this.visitor = visitor;
//   const { name } = visitor;

//   // this call to openMyRoom is for a Visitor to map its io.VisitorSocket.id to a human-readable name
//   io.VisitorSocket.emit('openMyRoom', name, (ack) => {
//     console.log(notice(ack.message));
//   });

//   this.fireTransition = function() {
//     fire(visitor);
//   };
// };

const EnterRoom = function(visitor) {
  this.visitor = visitor;

  const { name, room } = visitor;

  const msg = addTestMessage(name, room);

  // open the Room if necessary
  console.log('visitorSocket.id :>> ', visitorSocket.id);
  console.log('room :>> ', room);
  roomSocket.emit('openRoom', room);

  visitorSocket.emit('enterRoom', msg, (ack) => {
    console.log('Enter Room oracle:', ack);
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

// leave/change Room(s), but stay online
const LeaveRoom = function(visitor) {
  this.visitor = visitor;

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
  ['Connect', [[EnterRoomTransition, WarnRoomsTransition], 0.7, 0.3]],
  [
    'EnterRoom',
    [
      [LeaveRoomTransition, DisconnectTransition, WarnRoomsTransition],
      0.6,
      0.3,
      0.1,
    ],
  ],
  ['LeaveRoom', [[DisconnectTransition, EnterRoomTransition], 0.5, 0.5]],
  ['WarnRooms', [[], 1]],
  ['Disconnect', [[], 1]],
];
// end model properties

function run() {
  const rooms = ['Heathlands.Medical', 'ABMS.Medical', 'Heathlands.Cafe'];
  let testCount = 3;
  while (testCount--) {
    const visitor = new Visitor(pickVisitor(), rooms, transitions);
    visitor.start();
  }

  log.show();
}
