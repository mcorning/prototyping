// Exposure Warnings: V1
let v1 = [
  { room: 'a', date: '09.10' },
  { room: 'a', date: '09.10' },
  { room: 'b', date: '09.11' },
  { room: 'a', date: '09.12' },
  { room: 'c', date: '09.12' },
];

// Room A Messages
let aMessages = [
  { date: '09.09', visitor: 'V0' },
  { date: '09.10', visitor: 'V1' },
  { date: '09.10', visitor: 'V1' },
  { date: '09.10', visitor: 'V3' },
  { date: '09.10', visitor: 'V4' },
  { date: '09.11', visitor: 'V3' },
  { date: '09.11', visitor: 'V2' },
  { date: '09.12', visitor: 'V1' },
  { date: '09.12', visitor: 'V2' },
];

// Room B Messages
let bMessages = [
  { date: '09.09', visitor: 'V0' },
  { date: '09.10', visitor: 'V2' },
  { date: '09.10', visitor: 'V3' },
  { date: '09.10', visitor: 'V4' },
  { date: '09.10', visitor: 'V4' },
  { date: '09.11', visitor: 'V1' },
  { date: '09.11', visitor: 'V2' },
  { date: '09.12', visitor: 'V3' },
  { date: '09.12', visitor: 'V4' },
];

function log(label, data, show) {
  if (show) console.log(label, data);
}

function intersection(setA, setB) {
  let _intersection = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

function groupBy(objectArray, property, value) {
  return objectArray.reduce(function(acc, obj) {
    let key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj[value]);
    return acc;
  }, {});
}

// Sets
let visitedRoomSet = (array) => {
  return new Set(array.map((v) => v.room));
};

let visitedDateSet = (array) => {
  return new Set(array.map((v) => v.date));
};
// End Sets

// Maps
let visitMap = (array) => {
  return new Map(array.map((v) => [v.room, v.date]));
};
// End Maps

let visitObject = (array, prop, val) => {
  let x = groupBy(array, prop, val);
  return x;
};

let v1Warnings = visitObject(v1, 'room', 'date');
log('visitObject: v1Warnings', v1Warnings, 1);

let aMessageDates = visitObject(aMessages, 'date', 'visitor');
log('visitObject: aMessageDates', aMessageDates);

let aRoomSet = [...new Set(v1Warnings.a)];
log('Room A Alert Dates', aRoomSet);
log('For Room A:', 'Here are the necessary Exposure Alerts', 1);
aRoomSet.forEach((d) => {
  new Set(aMessageDates[d]).forEach((v) =>
    console.log(`${v}, on ${d} you may have been exposed to the virus.`)
  );
});
console.log('----------------------------------------------');

let bMessageDates = visitObject(bMessages, 'date', 'visitor');
log('visitObject: bMessageDates', bMessageDates);

let bRoomSet = [...new Set(v1Warnings.b)];
log('Room B Alert Dates', bRoomSet, 1);
log('For Room B:', 'Here are the necessary Exposure Alerts');
bRoomSet.forEach((d) => {
  new Set(bMessageDates[d]).forEach((v) =>
    console.log(`${v}, on ${d} you may have been exposed to the virus.`)
  );
});
