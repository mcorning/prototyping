// state transition helper
const fire = (visitor) => {
  const { count, currentState, enabledTransitionsFor } = visitor;

  const et = enabledTransitionsFor.get(currentState.constructor.name);
  // et looks like this:
  // [
  //    [ OpenMyRoomTransition, WarnRoomsTransition],
  //    0.99,
  //    0.01]
  // ]
  const spec = et.slice(1).reduce((a, c, i) => {
    a[i] = c;
    return a;
  }, {});

  const r = Math.random();
  console.log('r :>> ', r);

  let w = reducedWeightedRandom(et.slice(1), r);
  console.log('reduced i :>> ', w);
  let i = weightedRandom(spec, r);
  console.log('weighted i :>> ', i);
  const transition = et[0][i];
  console.log('-------------------------');
  log.add(
    `${count}) State: ${currentState.constructor.name} Transition: ${
      transition ? transition.name : 'Finished'
    }`
  );
  if (transition) {
    visitor.change(transition(visitor));
  }
};

// example spec: {0:0.6, 1:0.1, 2:0.1, 3:0.2}
function weightedRandom(spec, r) {
  console.log('W spec :>> ', spec);

  let sum = 0;
  for (let i in spec) {
    sum += spec[i];
    if (r <= sum) {
      return i;
    }
  }
}

// example spec: [0.6, 0.1, 0.1, 0.2]
function reducedWeightedRandom(spec, r) {
  console.log('R spec :>> ', spec);
  let x = spec.reduce((a, c, i, array) => {
    a += c;
    if (r <= a) {
      a = i;
      array = array.splice(1);
    }
    return a;
  }, 0);
  return x;
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
  log,
};
