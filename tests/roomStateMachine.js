// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Room
// self-documenting behavior
// io.ClientSocket event acknowledgements return state change
// state change is basis of assertions
console.clear();
//const moment = require('moment');

const { fire, log } = require('./helpers');
const { getAlerts } = require('./helpersRoom');
const { pickRoomName } = require('./roomData.js');
const { visitors, pickVisitor } = require('./visitorData.js');

const io = require('./roomClientSocket');

const clc = require('cli-color');
const success = clc.red.green;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const bold = clc.bold;

const DEBUG = 0; // use this to control some log spew

let countDownFrom = 6;

let name = '';

// entry point for state machine is inside socket.io connect event handler
io.ClientSocket.on('connect', () => {
  console.log('Socket.io Client ID:', io.ClientSocket.id);
  runModel();
});
// end of server-driven test

// base class
const Room = function(name, visitors, transitions) {
  this.name = name;
  this.visitors = visitors;
  this.enabledTransitionsFor = new Map(transitions);
  console.log('Room Name:', name);

  this.visitor = pickVisitor();
  console.log(notice('Chosen Visitor :>> ', this.visitor));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Connect after setting all properties and methods a Room will need
  this.currentState = new Connect(this);

  this.change = function(state) {
    // limits number of changes
    DEBUG && console.log('countDownFrom:', countDownFrom);
    if (!countDownFrom--) return;
    this.currentState = state;
    this.currentState.fireTransition();
  };

  this.start = function() {
    this.currentState.fireTransition();
  };
};

// State/Transition functions

const Connect = function(room) {
  this.room = room;

  this.fireTransition = function() {
    fire(room);
  };
};

const OpenRoom = function() {
  name = pickRoomName();
  this.room = new Room(name, visitors, transitions);

  const msg = {
    room: this.room.name,
    message: 'Opened',
    sentTime: new Date().toISOString(),
  };
  io.ClientSocket.emit('openRoom', msg, (ack) => {
    console.log(ack);
  });

  this.fireTransition = function() {
    fire(this.room);
  };
};

// leave/change Room(s), but stay online
const CloseRoom = function(room) {
  io.ClientSocket.disconnect();
  this.room = room;
  const msg = {
    room: room.name,
    message: 'Closed',
    sentTime: new Date().toISOString(),
  };
  io.ClientSocket.emit('closeRoom', msg, (ack) => {
    console.log(ack);
  });
  this.fireTransition = function() {
    fire(room);
  };
};

// disconnect from server (e.g., shut down browser)
const Disconnect = function(room) {
  this.room = room;

  this.fireTransition = function() {
    fire(room);
    io.ClientSocket.emit('disconnect');
  };
};

// this is the only event that references visitor
const AlertVisitor = function(visitor) {
  const alertsMap = getAlerts(visitor);
  alertsMap.forEach(function(value, key) {
    let message = {
      visitor: visitor.visitor,
      message: `${value}. To stop the spread, self-quarantine for 14 days.`,
      sentTime: new Date().toISOString(),
    };
    io.ClientSocket.emit('alertVisitor', message, (ack) => {
      ack.slice(0, 7) == 'WARNING' ? log.add(error(ack)) : log.add(warn(ack));
    });
    log.add(success(`Sent message to ${key}:`, message.message));
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

// model properties

const OpenRoomTransition = () => new OpenRoom();
const CloseRoomTransition = (room) => new CloseRoom(room);
const DisconnectTransition = (room) => new Disconnect(room);
const AlertVisitorTransition = (visitor) => new AlertVisitor(visitor);

// these are emit method options in the Room.vue (as opposed the sockets on event handler options)
const transitions = [
  ['Connect', [[OpenRoomTransition, AlertVisitorTransition], 0.99, 0.01]],
  ['AlertVisitor', [[], 1]],
  [
    'OpenRoom',
    [
      [CloseRoomTransition, AlertVisitorTransition, DisconnectTransition],
      0.6,
      0.3,
      0.1,
    ],
  ],
  ['CloseRoom', [[OpenRoomTransition, DisconnectTransition], 0.5, 0.5]],
  ['Disconnect', [[], 1]],
];
// end model properties

function runModel() {
  let room = new Room(pickRoomName(), visitors, transitions);
  room.start();

  log.show();
}
