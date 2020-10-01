// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Visitor
// self-documenting behavior
// ioClient event acknowledgements return state change
// state change is basis of assertions

const io = require('socket.io-client');
const ioClient = io.connect('http://localhost:3003/');
const DEBUG = 0; // use this to control some log spew
const visitorName = 'Nurse Diesel';

const EnterRoomTransition = (visitor) => new EnterRoom(visitor);
const DisconnectTransition = (visitor) => new Disconnect(visitor);
const OpenMyRoomTransition = (visitor) => new OpenMyRoom(visitor);
const WarnRoomsTransition = (visitor) => new WarnRooms(visitor);

ioClient.on('connect', () => {
  console.log('Socket.io Client ID:', ioClient.id);
  console.log('Visitor Name:', visitorName);
  run();
});

// this test is driven from the socket.io server (when enabled)
ioClient.on('exposureAlert', (alertMessage) => console.error(alertMessage));
// end of server-driven test

// helper function for this.fireTransition() that can handle multiple enabled transitions:
function fireFrom(visitor, enabledTransitions) {
  const idx = Math.floor(Math.random() * enabledTransitions.length);
  const transition = enabledTransitions[idx];
  log.add(
    `${visitor.count}) State: ${visitor.currentState.constructor.name} Transition: ${transition.name}`
  );

  visitor.change(transition(visitor));
}

// base class
const Visitor = function(name, rooms) {
  this.count = 6;
  this.name = name;
  this.rooms = rooms;
  const idx = Math.floor(Math.random() * this.rooms.length);
  this.room = this.rooms[idx];
  console.log('Chosen Room :>> ', this.room);
  console.log('============================================');
  console.log('Tested State/Transitions:');

  this.currentState = new Connect(this);

  // be sure you call Connect after setting all properties and methods a Visitor will need
  this.change = function(state) {
    // limits number of changes
    if (!this.count--) return;
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

  // sometimes fireTransition has more then one option. if so, delegate to fireFrom()
  this.fireTransition = function() {
    fireFrom(visitor, [OpenMyRoomTransition, WarnRoomsTransition]);
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
    ack.slice(0, 7) == 'WARNING' ? console.error(ack) : console.log(ack);
  });

  // sometimes fireTransition has more then one option. if so, delegate to fireFrom()
  // other times, there's only one enabled transition
  // so, for now, we ensure a Visitor always checks-in first thing
  this.fireTransition = function() {
    log.add(`${visitor.count}) State: WarnRooms`);

    visitor.change(new LeaveRoom(visitor));
  };
};

const OpenMyRoom = function(visitor) {
  this.visitor = visitor;
  const { name, count } = visitor;

  // this call to openMyRoom is for a Visitor to map its ioClient.id to a human-readable name
  ioClient.emit('openMyRoom', name, (ack) => {
    console.log(ack.message);
  });
  this.fireTransition = function() {
    log.add(`${count}) State: OpenMyRoom  Transition: EnterRoom`);
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
  ioClient.emit('enterRoom', msg, (ack) => {
    console.log(ack);
  });

  // NOTE: we could use the same enabledTransition scheme as LeaveRoom
  // but for now, we ensure a Visitor always checks-in
  this.fireTransition = function() {
    log.add(`${visitor.count}) State: EnterRoom  Transition: LeaveRoom`);

    visitor.change(new LeaveRoom(visitor));
  };
};

// leave/change Room(s), but stay online
const LeaveRoom = function(visitor) {
  this.visitor = visitor;

  this.fireTransition = function() {
    fireFrom(visitor, [DisconnectTransition, EnterRoomTransition]);
  };
};

// disconnect from server (e.g., shut down browser)
const Disconnect = function(visitor) {
  this.fireTransition = function() {
    visitor.count = 0;
    log.add(
      `${visitor.count}) State: Disconnect ${ioClient.id} Transition: none`
    );
    ioClient.emit('disconnect');
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
  const rooms = ['Heathlands.Medical', 'ABMS.Medical', 'Heathlands.Cafe'];
  const visitor = new Visitor(visitorName, rooms);
  visitor.start();

  log.show();
}
