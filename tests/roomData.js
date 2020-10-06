const DEBUG = 0;
const messages = [
  {
    visitor: 'Nurse Diesel',
    room: 'Heathlands.Medical',
    message: 'Entered',
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
function exposureDates(visitor) {
  return messages.filter((v) => v.visitor == visitor).map((v) => v.sentTime);
}
function exposureDatesSet(visitor) {
  return new Set(exposureDates(visitor));
}

module.exports = {
  messages,
  exposureDates,
  exposureDatesSet,
};

function test() {
  let y = exposureDatesSet('Nurse Diesel');

  console.log('set', [...y]);
  y.forEach((date) => console.log('date:', date));
}
DEBUG && test();
