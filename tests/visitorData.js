// const { groupBy } = require('./helpers');

const visitors = [
  { visitor: 'Nurse Diesel', id: 'kWjzGUKmvWhgeRlmAAAA', nsp: 'enduringNet' },
  { visitor: 'Nurse Jackie', id: 'FWzLl5dS9sr9FxDsAAAB', nsp: 'enduringNet' },
  { visitor: 'AirGas Inc', id: 'JgvrILSxDwXRWJUpAAAC', nsp: 'enduringNet' },
];

// object indentifies require a new data structure: Map (where the key can be an object)
const messages = [
  {
    visitor: {
      visitor: 'Nurse Diesel',
      id: 'kWjzGUKmvWhgeRlmAAAA',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: {
      visitor: 'Nurse Diesel',
      id: 'kWjzGUKmvWhgeRlmAAAA',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-14T02:53:33.738Z',
  },
  {
    visitor: {
      visitor: 'Nurse Diesel',
      id: 'kWjzGUKmvWhgeRlmAAAA',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: {
      visitor: 'Nurse Diesel',
      id: 'kWjzGUKmvWhgeRlmAAAA',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: {
      visitor: 'AirGas Inc',
      id: 'JgvrILSxDwXRWJUpAAAC',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: {
      visitor: 'AirGas Inc',
      id: 'JgvrILSxDwXRWJUpAAAC',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Cafe',
      id: 'e1suC3Rdpj_1PuR3AAAB',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T01:00:04.248Z',
  },
  {
    visitor: {
      visitor: 'Nurse Jackie',
      id: 'FWzLl5dS9sr9FxDsAAAB',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: {
      visitor: 'Nurse Jackie',
      id: 'FWzLl5dS9sr9FxDsAAAB',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-14T00:33:04.248Z',
  },
  {
    visitor: {
      visitor: 'Nurse Jackie',
      id: 'FWzLl5dS9sr9FxDsAAAB',
      nsp: 'enduringNet',
    },

    room: {
      room: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-17T00:33:04.248Z',
  },
];

// map = ke:value
// visitor:
//    {room:[
//      date
//      date]}
//    {room[
//      date]}
// visitor:
//    {room:[
//      date]}

function groupBy(payload) {
  const { array, prop, val } = payload;
  return array.reduce(function(acc, obj) {
    acc.set(obj[prop], (acc.get(obj[prop]) || []).concat(obj[val]));
    return acc;
  }, new Map());
}

function getExposures(visitor) {
  return messages.filter((v) => v.visitor.visitor == visitor);
}

function getExposureDates(visitor) {
  return messages
    .filter((v) => v.visitor.visitor == visitor)
    .map((v) => v.sentTime);
}

function getExposureDatesSet(visitor) {
  return new Set(getExposureDates(visitor));
}

// WARNING MESSAGE STRUCT:
//{
//   sentTime: '2020-09-19T00:56:54.570Z',
//   visitor: {
//     visior: 'Nurse Jackie',
//     id: 'FWzLl5dS9sr9FxDsAAAB',
//     nsp: 'enduringNet',
//   },
//   warning: {              // ONE ROOM PER WARNING
//     room: {
//       room: 'Heathlands Medical',
//       id: 'd6QoVa_JZxnM_0BoAAAA',
//       nsp: 'enduringNet',
//     },
//     dates: [
//       '2020-09-19T00:33:04.248Z',  // WARNING CAN
//       '2020-09-14T02:53:33.738Z',  // HAVE MULTIPLE
//       '2020-09-18T07:15:00.00Z',   // VISIT DATES
//     ],
//   },
// };
function getWarning(visitor) {
  let m = messages
    .filter((v) => v.visitor.id === visitor)
    .map((v) => {
      return { visitor: v.visitor.id, room: v.room, sentTime: v.sentTime };
    });
  let payload = {
    array: m,
    prop: 'room',
    val: 'sentTime',
  };
  return groupBy(payload);
}

function pickVisitor(visitors) {
  const idx = Math.floor(Math.random() * visitors.length);
  return visitors[idx];
}

module.exports = {
  messages,
  getExposureDates,
  getExposureDatesSet,
  getExposures,
  getWarning,
  pickVisitor,
  visitors,
};

const TESTING = 0;
// const INCLUDE = 0;

function testGetWarning() {
  let vIds = messages.reduce((a, c) => {
    a.add(c.visitor.id);
    return a;
  }, new Set());
  let v = pickVisitor([...vIds]);
  let x = {
    sentTime: new Date().toISOString(),
    visitor: v,
    warning: getWarning(v),
  };
  console.log(JSON.stringify(x, null, '\t'));
  console.log();
}

TESTING && testGetWarning();
