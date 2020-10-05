// based on a true story: https://dofactory.com/javascript/design-patterns/state

// Model-based test of Room
// self-documenting behavior
// ioClient event acknowledgements return state change
// state change is basis of assertions
console.clear();
const moment = require('moment');

const helpers = require('./helpers');
const { fire, log } = helpers;

const clc = require('cli-color');
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const bold = clc.bold;

const io = require('socket.io-client');
const ioClient = io.connect('http://localhost:3003/');

// entry point for state machine is inside socket.io connect event handler
ioClient.on('connect', () => {
  console.log(notice('Socket.io Client ID:', ioClient.id));
  console.log(notice('Room Name:', name));
  run();
});

// this test is driven from the socket.io server (when enabled)
ioClient.on('notifyRoom', (data, ack) => {
  // data can be on object or an array

  const { exposureDates, room, visitor } = data.length ? data[0] : data;

  let messageDates = this.groupBy({
    array: this.messages,
    prop: 'sentTime',
    val: 'visitor',
  });
  if (!Object.keys(messageDates).length) {
    alert(
      'UNEXEPECTED STATE: \nThere should be messages from the alerting Visitor.'
    );
    return;
  }
  console.log('messageDates:', messageDates);

  let alerts = new Map();
  // of only a single incoming date, make a Set with that
  // otherwise use the object for the Set
  let exposureDatesSet =
    typeof exposureDates == 'string'
      ? new Set().add(exposureDates)
      : new Set(exposureDates);

  console.log('Alert Dates', exposureDatesSet);
  console.log('Here are the necessary Exposure Alerts');
  exposureDatesSet.forEach((date) => {
    messageDates[moment(date).format(this.today)].forEach((v) => {
      let phrase =
        v != visitor
          ? 'BE ADVISED: you may have been exposed to the virus'
          : 'CONFIRMING: you may have exposed others to the virus';
      let msg = `${v}, ${phrase} on date(s): ${moment(date).format('llll')}`;
      let alert = alerts.get(v);
      alerts.set(
        v,
        alert ? alert.concat(`, ${moment(date).format('llll')}`) : msg
      );
    });
  });

  // iterate the Map and emit alertVisitor event
  // Server will ensure a Visitor is online before forwarding event
  // otherwise, cache Visitor until they login again
  for (let [key, value] of alerts.entries()) {
    this.emit({
      event: 'alertVisitor',
      message: {
        visitor: key,
        message: `${value}. To stop the spread, self-quarantine for 14 days.`,
        sentTime: new Date().toISOString(),
      },
      ack: (ack) => {
        this.log(ack, 'alert');
      },
    });
  }

  if (ack) ack(`${visitor}, ${room} alerted`);
  this.alertMessage = Object.keys(messageDates).length
    ? `Visitor warning triggered Exposure Alert for ${
        Object.keys(messageDates).length
      } exposure date(s) in ${room}.`
    : `Exposure Alert does not apply: No other visitor(s) to ${room} during exposure dates.`;
  this.alertColor = 'warning';
  this.alertIcon = 'mdi-home-alert';
  this.alert = true;
});
ioClient.on('checkIn', (message) => console.log(message));
ioClient.on('checkOut', (message) => console.log(message));
ioClient.on('updatedOccupancy', (message) => {
  if (message.room == this.roomId) {
    // room.occupancy = message.occupancy;
  }
  log(`${message.room} occupancy is now ${message.occupancy}`);
});

// end of server-driven test

const DEBUG = 0; // use this to control some log spew

// model properties
const name = 'Heathlands.Medical';

const OpenRoomTransition = (room) => new OpenRoom(room);
const CloseRoomTransition = (room) => new CloseRoom(room);
const DisconnectTransition = (room) => new Disconnect(room);
const OpenMyRoomTransition = (room) => new OpenMyRoom(room);
const AlertVisitorTransition = (visitor) => new AlertVisitor(visitor);

// these are emit method options in the Room.vue (as opposed the sockets on event handler options)
const transitions = [
  ['Connect', [[OpenMyRoomTransition, AlertVisitorTransition], 0.7, 0.3]],
  ['OpenMyRoom', [[OpenRoomTransition, AlertVisitorTransition], 0.7, 0.3]],
  ['AlertVisitor', [[], 1]],
  ['OpenRoom', [[CloseRoomTransition], 1]],
  ['CloseRoom', [[OpenRoomTransition, DisconnectTransition], 0.5, 0.5]],
  ['Disconnect', [[], 1]],
];
// end model properties

// base class
const Room = function(name, visitors, transitions) {
  this.count = 6;
  this.name = name;
  this.visitors = visitors;
  this.enabledTransitionsFor = new Map(transitions);

  const idx = Math.floor(Math.random() * this.visitors.length);
  this.visitor = this.visitors[idx];
  console.log(notice('Chosen Visitor :>> ', this.visitor));
  console.log(notice('============================================'));
  console.log(bold('Tested State/Transitions:'));

  // be sure you call Connect after setting all properties and methods a Room will need
  this.currentState = new Connect(this);

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

const Connect = function(room) {
  this.room = room;

  // // to ensure the Visitor has a Room to enter, set up the needed room on the server right away.
  // // this call to openMyRoom is for a Room to map its ioClient.id to a human-readable name
  // // to be less confusing, this event really should be in it's own State/Transition
  // // NOTE: ack contains data for the assert
  // ioClient.emit('openMyRoom', room, (ack) => {
  //   console.log('============================================');

  //   console.log('Available Rooms:');
  //   console.table(ack.rooms);
  //   const oracle = ack.rooms.filter((v) => v.name == room);
  //   console.assert(
  //     oracle.length,
  //     `Expected ${room} in available Rooms: ${ack.rooms.map((v) => v.name)}`
  //   );
  //   DEBUG && console.log(oracle);
  // });

  this.fireTransition = function() {
    fire(room);
  };
};

const OpenMyRoom = function(room) {
  this.room = room;
  const { name } = room;

  // this call to openMyRoom is for a Visitor to map its ioClient.id to a human-readable name
  ioClient.emit('openMyRoom', name, (ack) => {
    console.log(notice(ack.message));
  });

  this.fireTransition = function() {
    fire(room);
  };
};

const OpenRoom = function(room) {
  this.room = room;

  const msg = {
    room: room,
    message: 'Opened',
    sentTime: new Date().toISOString(),
  };
  ioClient.emit('openRoom', msg, (ack) => {
    console.log(ack);
  });

  this.fireTransition = function() {
    fire(room);
  };
};

// leave/change Room(s), but stay online
const CloseRoom = function(room) {
  this.room = room;

  this.fireTransition = function() {
    fire(room);
  };
};

// disconnect from server (e.g., shut down browser)
const Disconnect = function(room) {
  this.room = room;

  this.fireTransition = function() {
    fire(room);
    ioClient.emit('disconnect');
  };
};

// this is the only event that references visitor
const AlertVisitor = function(visitor) {
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
  ioClient.emit('alertVisitor', msg, (ack) => {
    ack.slice(0, 7) == 'WARNING'
      ? console.log(error(ack))
      : console.log(warn(ack));
  });

  this.fireTransition = function() {
    fire(visitor);
  };
};

function run() {
  const visitors = ['Nurse Diesel', 'Nurse Jackie', 'AirGas Inc'];
  const room = new Room(name, visitors, transitions);
  room.start();

  log.show();
}
