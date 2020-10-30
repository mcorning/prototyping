// const clc = require('cli-color');
// const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
// const info = clc.cyan;
// const notice = clc.blue;
// const highlight = clc.magenta;
// const bold = clc.bold;

const socketIoServerUrl = 'http://localhost:3003';

const moment = require('moment');
const base64id = require('base64id');

const DEBUG = 0;

const newId = (() => {
  const id = base64id.generateId();
  console.log('New ID', id);
  return id;
})();

// helper helpers
function getRandomIntBetween(min, max) {
  // return Math.floor(Math.random() * Math.floor(max))-1;
  return Math.random() * (max - min) + min;
}

// helpers
function addTestMessage(you, room) {
  // open up the message list beyond today
  // get a random number of days back for test data
  let days = getRandomIntBetween(2, 4);
  let msg = {
    visitor: you,
    room: room,
    message: 'Entered',
    sentTime: moment()
      .add(-days, 'day')
      .toISOString(),
  };
  return msg;
}

const getNow = () => {
  // const shortDateTimeFormat = 'lll';
  const timeFormat = 'HH:MM:SS';
  return moment().format(timeFormat);
};

// context is passed by the State Machine.
// the visitor object is the context in the visitorStateMachine, for example.
const fire = (context) => {
  const { currentState, enabledTransitionsFor } = context;

  const et = enabledTransitionsFor.get(currentState.constructor.name);

  const r = Math.random();
  DEBUG && console.log('r :>> ', r);

  let i = reducedWeightedRandom(et.slice(1), r);

  const transition = et[0][i];
  // console.log('--------------------------------------------------');
  logResults.add(
    `State: ${currentState.constructor.name} Transition: ${
      transition ? transition.name : 'Finished'
    }`
  );
  if (transition) {
    context.change(transition(context));
  }
};

// example spec: [0.6, 0.1, 0.1, 0.2]
function reducedWeightedRandom(spec, r) {
  DEBUG && console.log('R spec :>> ', spec);
  let x = spec.reduce((a, c, i, s) => {
    DEBUG && console.log(s);
    a += c;
    if (r <= a) {
      a = i;
      s = s.splice(1); // changing the array will end the iteration
    }
    return a;
  }, 0);
  return x;
}

function groupMessagesByDateAndVisitor(payload) {
  const { array, prop, val } = payload;

  return array
    .filter((v) => v[val]) // ignore Room Opened/Closed messages
    .reduce(function(a, c) {
      let key = moment(c[prop]).format('YYYY-MM-DD');
      if (!a[key]) {
        a[key] = [];
      }
      a[key].push(c[val]);
      return a;
    }, {});
}

function groupMessagesByDateAndRoom(payload) {
  const { array, prop, val } = payload;
  return array
    .filter((v) => v[val]) // ignore Room Opened/Closed messages
    .reduce(function(a, c) {
      let key = moment(c[prop]).format('YYYY-MM-DD');
      if (!a[key]) {
        a[key] = [];
      }
      a[key].push(c[val]);
      return a;
    }, {});
}

function groupMessagesByRoomAndDate(payload) {
  const { array, prop, val } = payload;
  let visitDates = [];
  return array
    .filter((v) => v[val]) // ignore Room Opened/Closed messages
    .reduce(function(a, c) {
      // .push(date);
      let key = c[prop].id;
      if (!a[key]) {
        a[key] = {
          room: '',
          dates: [],
        };
      }
      // ;
      visitDates.push(moment(c[val]).format('YYYY-MM-DD'));
      a[key] = {
        room: c.room.room,
        dates: visitDates,
      };
      return a;
    }, {});
}

// log helper
const logResults = (function() {
  let logResults = [];
  return {
    hasData: function() {
      return logResults.length;
    },

    add: function(msg) {
      logResults.push(msg);
    },

    clear: function() {
      logResults = [];
    },

    show: function(title = 'Log Results') {
      console.groupCollapsed(title);
      console.log(printJson(logResults));
      logResults = [];
      console.groupEnd();
    },
  };
})(); // the () turns the function declaration into a working function for the caller

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

function printJson(json) {
  return JSON.stringify(json, null, 3);
}

function report(title, a1, a2, b1, b2) {
  function item(name, id) {
    this.name = name;
    this.id = id;
  }
  let items = {};
  console.groupCollapsed(title);
  items.visitor = new item(a1, a2);
  items.room = new item(b1, b2);

  console.table(items);

  console.groupEnd();
}

module.exports = {
  addTestMessage,
  getNow,
  groupMessagesByDateAndRoom,
  groupMessagesByDateAndVisitor,
  groupMessagesByRoomAndDate,
  fire,
  log,
  logResults,
  newId,
  printJson,
  report,
  socketIoServerUrl,
};
