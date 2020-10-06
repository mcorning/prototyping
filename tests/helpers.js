// state transition helper
const moment = require('moment');

const DEBUG = 0;
const fire = (context) => {
  const { count, currentState, enabledTransitionsFor } = context;

  const et = enabledTransitionsFor.get(currentState.constructor.name);

  const r = Math.random();
  DEBUG && console.log('r :>> ', r);

  let i = reducedWeightedRandom(et.slice(1), r);

  const transition = et[0][i];
  console.log('-------------------------');
  log.add(
    `${count}) State: ${currentState.constructor.name} Transition: ${
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

module.exports = {
  fire,
  groupBy,
  log,
};
