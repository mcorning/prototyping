// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// ioClient event acknowledgements return state change
// state change is basis of assertions
console.clear();
const helpers = require('./helpers');
const { fire, log } = helpers;

const clc = require('cli-color');
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const bold = clc.bold;

const io = require('socket.io-client');
const ioClient = io.connect('http://localhost:3003/');
const DEBUG = 0; // use this to control some log spew

// entry point for state machine is inside socket.io connect event handler
ioClient.on('connect', () => {
  console.log(notice('Socket.io Client ID:', ioClient.id));
  console.log(notice('Visitor Name:', visitorName));
  run();
});

// this test is driven from the socket.io server (when enabled)
ioClient.on('exposureAlert', (alertMessage) =>
  console.log(error('ALERT:', alertMessage))
);
// end of server-driven test

// model properties
const visitorName = 'Nurse Diesel';

const EnterRoomTransition = (visitor) => new EnterRoom(visitor);
const LeaveRoomTransition = (visitor) => new LeaveRoom(visitor);
const DisconnectTransition = (visitor) => new Disconnect(visitor);
const OpenMyRoomTransition = (visitor) => new OpenMyRoom(visitor);
const WarnRoomsTransition = (visitor) => new WarnRooms(visitor);

// these are emit method options in the Visitor.vue (as opposed the sockets on event handler options)
const transitions = [
  ['Connect', [[OpenMyRoomTransition, WarnRoomsTransition], 0.7, 0.3]],
  ['OpenMyRoom', [[EnterRoomTransition, WarnRoomsTransition], 0.7, 0.3]],
  ['WarnRooms', [[], 1]],
  ['EnterRoom', [[LeaveRoomTransition], 1]],
  ['LeaveRoom', [[DisconnectTransition, EnterRoomTransition], 0.5, 0.5]],
  ['Disconnect', [[], 1]],
];
// end model properties

// base class
const Visitor = function(name, rooms, transitions) {
  this.countDownFrom = 6;
  this.name = name;
  this.rooms = rooms;
  this.enabledTransitionsFor = new Map(transitions);

  const idx = Math.floor(Math.random() * this.rooms.length);
  this.room = this.rooms[idx];
  console.log(notice('Chosen Room :>> ', this.room));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Connect after setting all properties and methods a Visitor will need
  this.currentState = new Connect(this);

  this.change = function(state) {
    // limits number of changes
    if (!this.countDownFrom--) return;
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
  const { room } = visitor;

  // to ensure the Visitor has a Room to enter, set up the needed room on the server right away.
  // this call to openMyRoom is for a Room to map its ioClient.id to a human-readable name
  // to be less confusing, this event really should be in it's own State/Transition
  // NOTE: ack contains data for the assert
  ioClient.emit('openMyRoom', room, (ack) => {
    console.log('============================================');

    console.log('Available Rooms:');
    console.table(ack.rooms);
    const oracle = ack.rooms.filter((v) => v.name == room);
    console.assert(
      oracle.length,
      `Expected ${room} in available Rooms: ${ack.rooms.map((v) => v.name)}`
    );
    DEBUG && console.log(oracle);
  });

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
  ioClient.emit('exposureWarning', msg, (ack) => {
    ack.slice(0, 7) == 'WARNING'
      ? console.log(error(ack))
      : console.log(warn(ack));
  });

  this.fireTransition = function() {
    fire(visitor);
    ioClient.emit('disconnect');
  };
};

const OpenMyRoom = function(visitor) {
  this.visitor = visitor;
  const { name } = visitor;

  // this call to openMyRoom is for a Visitor to map its ioClient.id to a human-readable name
  ioClient.emit('openMyRoom', name, (ack) => {
    console.log(notice(ack.message));
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

const EnterRoom = function(visitor) {
  this.visitor = visitor;

  const { name, room } = visitor;

  const msg = {
    visitor: name,
    room: room,
    message: 'Entered',
    sentTime: new Date().toISOString(),
  };
  ioClient.emit('enterRoom', msg, (ack) => {
    console.log(ack);
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
    ioClient.emit('disconnect');
  };
};

function run() {
  const rooms = ['Heathlands.Medical', 'ABMS.Medical', 'Heathlands.Cafe'];
  const visitor = new Visitor(visitorName, rooms, transitions);
  visitor.start();

  log.show();
}
