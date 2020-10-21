const clc = require('cli-color');
const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
const info = clc.cyan;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

// state transition helper
const moment = require('moment');

const DEBUG = 0;

// helper helpers
function getRandomIntBetween(min, max) {
  // return Math.floor(Math.random() * Math.floor(max))-1;
  return Math.random() * (max - min) + min;
}

// helpers
function addTestMessage(yourId, roomId) {
  // open up the message list beyond today
  // get a random number of days back for test data
  let days = getRandomIntBetween(2, 4);
  let msg = {
    visitor: yourId,
    room: roomId,
    message: 'Entered',
    sentTime: moment()
      .add(-days, 'day')
      .toISOString(),
  };
  return msg;
}

const getNow = () => {
  return moment().format('lll');
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
  console.log('--------------------------------------------------');
  log.add(
    `State: ${currentState.constructor.name} Transition: ${
      transition ? transition.name : 'Finished'
    }`
  );
  log.show();
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
      s = s.splice(1);
    }
    return a;
  }, 0);
  return x;
}

function groupBy(payload) {
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

// log helper
const logResults = (function() {
  let logResults = [];
  let title = 'Log Results';
  return {
    hasData: function() {
      return logResults.length;
    },

    entitle: function(caption) {
      if (!this.hasData()) title = caption;
    },

    add: function(msg) {
      logResults.push(msg);
    },

    clear: function() {
      logResults = [];
    },

    show: function() {
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
      log += msg + '/n';
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
  groupBy,
  fire,
  log,
  logResults,
  printJson,
  report,
};
