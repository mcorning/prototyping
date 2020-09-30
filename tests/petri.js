// Model-based test of Visitor
// self-documenting behavior
// socket event acknowledgements return state change
// state change is basis of assertions

const io = require('socket.io-client');
const socket = io('http://localhost:3003/');
const DEBUG = 0;
const visitorName = 'Nurse Diesel';

const EnterRoomCommand = (visitor) => new EnterRoom(visitor);
const DisconnectCommand = (visitor) => new Disconnect(visitor);
const OpenMyRoomCommand = (visitor) => new OpenMyRoom(visitor);
const WarnRoomsCommand = (visitor) => new WarnRooms(visitor);

const Visitor = function(name) {
  this.count = 5;
  this.name = name;
  this.rooms = ['Heathlands.Medical', 'ABMS.Medical'];
  const idx = Math.floor(Math.random() * this.rooms.length);
  this.room = this.rooms[idx];
  console.log('Chosen Room :>> ', this.room);

  // be sure you call Connect after setting all properties and methods a Visitor will need
  let currentState = new Connect(this);

  this.change = function(state) {
    // limits number of changes
    if (!this.count--) return;
    currentState = state;
    currentState.fireTransition();
  };

  this.start = function() {
    currentState.fireTransition();
  };
};

function fireFrom(visitor, enabledTransitions) {
  const idx = Math.floor(Math.random() * enabledTransitions.length);
  const transition = enabledTransitions[idx];

  visitor.change(transition(visitor));
}

const Connect = function(visitor) {
  this.visitor = visitor;
  const { room } = visitor;

  // this call to openMyRoom is for a Room to map its socket.id to a human-readable name
  // NOTE: ack contains data for the assert
  socket.emit('openMyRoom', room, (ack) => {
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
    log.add(`${visitor.count}) EnterRoom`);

    fireFrom(visitor, [OpenMyRoomCommand, WarnRoomsCommand]);
  };
};

const WarnRooms = function(visitor) {
  this.visitor = visitor;
  const { name, room } = visitor;

  const msg = {
    visitor: name,
    room: room,
    message: 'Entered',
    sentTime: new Date().toISOString(),
  };
  socket.emit('enterRoom', msg, (ack) => {
    console.log(ack);
  });

  // NOTE: we could use the same enabledTransition scheme as LeaveRoom
  // but for now, we ensure a Visitor always checks-in
  this.fireTransition = function() {
    log.add(`${visitor.count}) EnterRoom`);

    visitor.change(new LeaveRoom(visitor));
  };
};

const OpenMyRoom = function(visitor) {
  this.visitor = visitor;
  const { name, count } = visitor;

  // this call to openMyRoom is for a Visitor to map its socket.id to a human-readable name
  socket.emit('openMyRoom', name, (ack) => {
    console.log(ack.message);
  });
  this.fireTransition = function() {
    log.add(`${count}) OpenMyRoom`);
    visitor.change(new EnterRoom(visitor));
  };
};

const EnterRoom = function(visitor) {
  const { name, room } = visitor;

  const msg = {
    visitor: name,
    room: room,
    message: 'Entered',
    sentTime: new Date().toISOString(),
  };
  socket.emit('enterRoom', msg, (ack) => {
    console.log(ack);
  });

  // NOTE: we could use the same enabledTransition scheme as LeaveRoom
  // but for now, we ensure a Visitor always checks-in
  this.fireTransition = function() {
    log.add(`${visitor.count}) EnterRoom`);

    visitor.change(new LeaveRoom(visitor));
  };
};

// leave/change Room(s), but stay online
const LeaveRoom = function(visitor) {
  this.visitor = visitor;
  const enabledTransitions = [DisconnectCommand, EnterRoomCommand];
  const idx = Math.floor(Math.random() * enabledTransitions.length);
  const transition = enabledTransitions[idx];
  this.fireTransition = function() {
    log.add(`${visitor.count}) LeaveRoom`);

    visitor.change(transition(visitor));
  };
};

// disconnect from server (e.g., shut down browser)
const Disconnect = function(visitor) {
  this.fireTransition = function() {
    visitor.count = 0;
    log.add(`${visitor.count}) Disconnect`);
  };
};

// log helper
const log = (function() {
  let log = '';

  return {
    add: function(msg) {
      log += msg + '\n';
    },
    show: function() {
      console.log(log);
      log = '';
    },
  };
})();

function run() {
  const visitor = new Visitor(visitorName);
  visitor.start();

  log.show();
}

run();
