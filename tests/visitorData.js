// const { groupBy } = require('./helpers');

const visitors = [
  { name: 'Nurse Diesel', id: 'kWjzGUKmvWhgeRlmAAAA', nsp: 'enduringNet' },
  { name: 'Nurse Jackie', id: 'FWzLl5dS9sr9FxDsAAAB', nsp: 'enduringNet' },
  { name: 'AirGas Inc', id: 'JgvrILSxDwXRWJUpAAAC', nsp: 'enduringNet' },
];

const messages = [
  {
    visitor: 'Nurse Diesel',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: '',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-14T02:53:33.738Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: 'AirGas Inc',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'AirGas Inc',
    room: {
      name: 'Heathlands Cafe',
      id: 'e1suC3Rdpj_1PuR3AAAB',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T01:00:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-14T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: {
      name: 'Heathlands Medical',
      id: 'd6QoVa_JZxnM_0BoAAAA',
      nsp: 'enduringNet',
    },
    message: 'Entered',
    sentTime: '2020-09-17T00:33:04.248Z',
  },
];

function groupBy(payload) {
  const { array, prop, val } = payload;
  return array.reduce(function(acc, obj) {
    let key = obj[prop];
    acc[key] = (acc[key] || []).concat(obj[val]);
    return acc;
  }, {});
}

function getExposures(visitor) {
  return messages.filter((v) => v.visitor == visitor);
}

function getExposureDates(visitor) {
  return messages.filter((v) => v.visitor == visitor).map((v) => v.sentTime);
}

function getExposureDatesSet(visitor) {
  return new Set(getExposureDates(visitor));
}

function getWarnings(visitor) {
  // See Transductions section of FieldNotes.md
  let arr = getExposures(visitor);
  if (TESTING) {
    console.log('exposures (Visitor messages):');
    console.log(JSON.stringify(arr, null, '\t'));
  }

  let payload = {
    array: arr,
    prop: 'room',
    val: 'sentTime',
  };
  return groupBy(payload);
}

function pickVisitor() {
  const idx = Math.floor(Math.random() * visitors.length);
  return visitors[idx];
}

module.exports = {
  messages,
  getExposureDates,
  getExposureDatesSet,
  getExposures,
  getWarnings,
  pickVisitor,
  visitors,
};

const TESTING = 1;

function test() {
  let v = pickVisitor();
  console.log(v);
  let y = getWarnings(v);
  console.log('warnings:', JSON.stringify(y, null, '\t'));
  let x = getExposureDatesSet(v);
  console.log('exposure dates set', JSON.stringify(x, null, '\t'));
  x.forEach((date) => console.log('date:', date));
}
TESTING && test();

console.info(
  TESTING ? 'Testing visitorDate.js' : 'visitorDate.js is tested code'
);
