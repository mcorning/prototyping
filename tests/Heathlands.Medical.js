const io = require('socket.io-client');
const socket = io('http://localhost:3003/');
let openRooms;

let msg = {
  room: 'Heathlands.Medical',
  message: 'Opened',
  sentTime: new Date().toISOString(),
};
socket.emit('openRoom', msg);

socket.on('availableRoomsExposed', (list) => {
  if (JSON.stringify(list) !== JSON.stringify(openRooms)) {
    openRooms = list;
    console.log(
      `${openRooms.length} Open Rooms: ${JSON.stringify(openRooms, null, '\t')}`
    );
  }
});
