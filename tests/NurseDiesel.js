const io = require('socket.io-client');
const socket = io('http://localhost:3003/');
let roomId;
let yourId = 'Nurse Diesel';
let openRooms;
let occupiedRooms;
let visitorsRooms;

let msg;

console.log(
  new Date(),
  '========================================================='
);

// socket.on('visitorsRoomsExposed', (list) => {
//   console.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`);
// });

socket.on('connect', () => {
  console.log(
    `Socket ${socket.id} ${socket.connected ? 'connected' : 'disconnected'}`
  );
  socket.emit('openMyRoom', 'Nurse Diesel', (ack) => {
    console.log(ack);
  });
  socket.emit('exposeAvailableRooms');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected reason:', reason);
  if (reason === 'io server disconnect') {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
  // else the socket will automatically try to reconnect
});

// socket.on('visitorsRoomsExposed', (list) => {
//   visitorsRooms = list;
//   console.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`);
//   console.table(list);
// });

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
