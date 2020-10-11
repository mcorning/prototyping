// const { groupBy } = require('./helpers');

const visitors = ['Nurse Diesel', 'Nurse Jackie', 'AirGas Inc'];

const messages = [
  {
    visitor: 'Nurse Diesel',
    room: 'Heathlands.Medical',
    message: '',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-14T02:53:33.738Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: 'Nurse Diesel',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-18T02:53:35.050Z',
  },
  {
    visitor: 'AirGas Inc',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'AirGas Inc',
    room: 'Heathlands.Cafe',
    message: 'Entered',
    sentTime: '2020-09-19T01:00:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-14T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-17T00:33:04.248Z',
  },
];

function groupBy(payload) {
  const { array, prop, val } = payload;

  return array.reduce(function(acc, obj) {
    let key = obj[prop];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj[val]);
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
  // Example warning
  //    warnings:{
  //      Heathlands.Medical:[
  //        '2020-09-19T00:33:04.248Z', '2020-09-19T00:35:38.078Z', '2020-09-14T02:53:33.738Z', '2020-09-18T02:53:35.050Z'
  //      ]
  //    }
  let payload = {
    array: getExposures(visitor),
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

const TESTING = 0;

function test() {
  let v = pickVisitor();
  console.log(v);
  let y = getWarnings(v);
  console.log('exposures:', y);
  let x = getExposureDatesSet(v);
  console.log('set', [...x]);
  x.forEach((date) => console.log('date:', date));
}
TESTING && test();

console.log(
  TESTING ? 'Testing visitorDate.js' : 'visitorDate.js is tested code'
);
