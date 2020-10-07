let lastUsedRoom = 'Heathlands.Medical';
const allKnownRooms = [
  'Heathlands.Medical',
  'Heathlands.Cafe',
  'ABMS.Medical',
  'ABMS.Lobby',
];

function pickRoomName() {
  const idx = Math.floor(Math.random() * allKnownRooms.length);
  lastUsedRoom = allKnownRooms[idx];
  return lastUsedRoom;
}

module.exports = {
  allKnownRooms,
  pickRoomName,
};

const DEBUG = 0;

function test() {
  console.log(pickRoomName());
  // let y = exposureDatesSet('Nurse Diesel');

  // console.log('set', [...y]);
  // y.forEach((date) => console.log('date:', date));
}
DEBUG && test();
