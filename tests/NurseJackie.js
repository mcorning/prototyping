const io = require('socket.io-client');
const socket = io('http://localhost:3003/');
const yourId = 'Nurse Jackie';
let roomId = '';
let openRooms;
let occupiedRooms;
let visitorsRooms;

// Visitors
socket.emit('openMyRoom', 'Nurse Jackie', (ack) => {
  console.log(ack);
});

let msg = {
  visitor: yourId,
  room: roomId,
  message: 'Entered',
  sentTime: new Date().toISOString(),
};
socket.emit('enterRoom', msg, (ack) => {
  console.log(ack);
});
// leave(true);

// function leave(close) {
//   socket.emit('disconnect', close);
//   console.log('Disconnecting...');
// }
//event handlers
socket.on('disconnect', (reason) => {
  console.log('Disconnected reason:', reason);
  if (reason === 'io server disconnect') {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
  // else the socket will automatically try to reconnect
});

socket.on('visitorsRoomsExposed', (list) => {
  visitorsRooms = list;
  console.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`);
});

socket.on('occupiedRoomsExposed', (list) => {
  occupiedRooms = list.map((v) => {
    return v;
  });
  console.log(`Occupied Rooms: ${JSON.stringify(list, null, '\t')}`);
  console.table(occupiedRooms);
});

socket.on('availableRoomsExposed', (list) => {
  openRooms = list;
  console.log(
    `${openRooms.length} Open Rooms: ${JSON.stringify(openRooms, null, '\t')}`
  );
  roomId = openRooms[0].name;
  msg = {
    visitor: yourId,
    room: roomId,
    message: 'Entered',
    sentTime: new Date().toISOString(),
  };
  socket.emit('enterRoom', msg);
});
