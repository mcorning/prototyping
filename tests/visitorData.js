/* Test Data Sets:
BVTs: 
1: 1) Visitor connects, 2) Visitor warns
2: 1) Visitor connects, 2) Enters Room
3: 1) Visitor connects, 2) Enters Room 3) Changes Room
4: 1) Visitor connects, 2) Enters Room 3) Leaves Room 
5: 1) Visitor connects, 2) Enters Room 3) Leaves Room 4) Disconnects

Test cascading alerts:
    AirGas Inc warns Heathlands Medial and Heathlands Cafe on 09.23.2020
    Nurse Diesel gets first alert
    Nurse Jackie gets first alert
    Nurse Diesel warns Manchester Pub
    Manchester Pub warns Doc Holliday
*/

const visitors = [
  { visitor: 'Nurse Diesel', id: 'kWjzGUKmvWhgeRlmAAAA', nsp: 'enduringNet' },
  { visitor: 'Nurse Jackie', id: 'FWzLl5dS9sr9FxDsAAAB', nsp: 'enduringNet' },
  { visitor: 'AirGas Inc', id: 'JgvrILSxDwXRWJUpAAAC', nsp: 'enduringNet' },
  { visitor: 'Doc Holliday', id: '4EuoyMOOsE4tflmtAAAA', nsp: 'enduringNet' },
];

// object indentifies require a new data structure: Map (where the key can be an object)
const messages = [
  //AirGas Inc
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
    sentTime: '2020-09-20T01:09:00.000Z',
  },

  //Doc Holliday
  {
    visitor: {
      visitor: 'Doc Holliday',
      id: '4EuoyMOOsE4tflmtAAAA',
      nsp: 'enduringNet',
    },
    room: {
      room: 'Manchester Pub',
      id: 'kSrcg7LYgbtyBio5AAAB',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-20T20:33:04.248Z',
  },

  // Nurse Diesel
  {
    visitor: {
      visitor: 'Nurse Diesel',
      id: 'kWjzGUKmvWhgeRlmAAAA',
      nsp: 'enduringNet',
    },
    room: {
      room: 'Manchester Pub',
      id: 'kSrcg7LYgbtyBio5AAAB',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-20T20:44:00.000Z',
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

  // Nurese Jackie
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

function pickVisitor(visitor = visitors) {
  if (typeof visitor === 'function') {
    // execute the passed in visitor function
    return visitor(visitors);
  }
  // else pick the visitor from its position in the visitors array
  const idx = Math.floor(Math.random() * visitors.length);
  return visitors[idx];
}

module.exports = {
  messages,
  getExposureDates,
  getExposureDatesSet,
  getExposures,
  getWarning,
  groupBy,
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
