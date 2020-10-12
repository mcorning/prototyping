let lastUsedRoom = 'Heathlands.Medical';

const rooms = [
  {
    name: 'Heathlands Medical',
    id: 'd6QoVa_JZxnM_0BoAAAA',
    nsp: 'enduringNet',
  },
  { name: 'Heathlands Cafe', id: 'e1suC3Rdpj_1PuR3AAAB', nsp: 'enduringNet' },
  { name: 'ABMS Medical', id: 'OUeNKcyWGGgX6fMWAAAC', nsp: 'enduringNet' },
];

function pickRoom() {
  const idx = Math.floor(Math.random() * rooms.length);
  lastUsedRoom = rooms[idx];
  return lastUsedRoom;
}

module.exports = {
  rooms,
  pickRoom,
};

const DEBUG = 0;

function test() {
  console.log(pickRoom());
  // let y = exposureDatesSet('Nurse Diesel');

  // console.log('set', [...y]);
  // y.forEach((date) => console.log('date:', date));
}
DEBUG && test();
