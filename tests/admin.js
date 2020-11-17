const base64id = require('base64id');
const io = require('socket.io-client');
//const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
// const bold = clc.bold;

// special helpers
const { getNow, printJson } = require('./helpers');
// end special helpers

// constants
// run this script once with null id value
// then copy generated id into admin object
const admin = {
  id: 'Am4uagdjIODx0XL1AAAA',
  admin: 'michael@secours.io',
  nsp: 'admin',
};

// helpers
const display = (title, message) => {
  console.groupCollapsed(`${title} results:`);
  console.table(message);
  console.groupEnd();
};
// end helpers
//listeners
const onAvailableRoomsExposed = (message) => {
  display('onAvailableRoomsExposed', message);
};
const onVisitorsRoomsExposed = (message) => {
  display('onVisitorsRoomsExposed', message);
};
const onOccupiedRoomsExposed = (message) => {
  display('onOccupiedRoomsExposed', message);
};

// end listeners

// events

// end events

// these are the sockets options in the Room.vue
// called by state machine
// room is an object {name, id, nsp}
async function OpenConnection(admin) {
  const id = admin.id || base64id.generateId();
  const nsp = admin.nsp || '/';
  const query = { admin: admin.admin, id: id, nsp: nsp };
  const clientSocket = io(`http://localhost:3003/${nsp}`, {
    query: query,
  });

  clientSocket.once('connect', () => {
    console.log(' ');
    console.log(highlight(getNow(), '-', 'Admin Socket.io connection made:'));
    console.table(clientSocket.query);
    console.log(' ');
    clientSocket.emit('message', 'successful test');
  });

  clientSocket.once('connect_error', (message) => {
    switch (message.type) {
      case 'TransportError':
        console.log(
          warn(
            `${clientSocket.query.admin ||
              clientSocket.query.visitor} attempted to connect...`
          )
        );
        console.log(
          error(
            '...but LCT Socket.io Server may have gone down at or before',
            getNow()
          )
        );
        break;

      default:
        console.log(error('Unhandled connection error:'));
        console.log(error(message.message));
    }
  });
  // specialized events
  // clientSocket.on('',)
  clientSocket.on('visitorsRoomsExposed', onVisitorsRoomsExposed);
  clientSocket.on('occupiedRoomsExposed', onOccupiedRoomsExposed);
  clientSocket.on('availableRoomsExposed', onAvailableRoomsExposed);

  return clientSocket;
}
console.log(info('Admin query:'));
console.table(admin);

OpenConnection(admin)
  .then((socket) => socket.connect())
  .then((result) => {
    console.log(success('Result:'));
    console.log(success(printJson(result.query)));
  });
