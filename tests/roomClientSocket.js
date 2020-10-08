const { groupBy, log, messages, printJson, report } = require('./helpersRoom');

const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

// methods called by state machine
const exposeAvailableRooms = (clientSocket) => {
  clientSocket.emit('exposeAvailableRooms', (rooms) => {
    console.log('Available Rooms:');
    console.table(rooms);
  });
};

const exposeOccupiedRooms = (clientSocket) => {
  clientSocket.emit('exposeOccupiedRooms', (rooms) => {
    console.log('Occupied Rooms:');
    console.table(rooms);
  });
};
// end methods called by state machine

// called by state machine
function OpenRoomConnection(token) {
  const clientSocket = io('http://localhost:3003', {
    query: { token: token },
  });

  clientSocket.on('connect', () => {
    console.log(highlight('Room Socket.io Client ID:', clientSocket.id));
  });

  clientSocket.on('availableRoomsExposed', (message) => {
    console.groupCollapsed('Available Rooms:');
    console.log(success('Available Rooms:', printJson(message)));
    console.groupEnd();
  });

  clientSocket.on('checkIn', (message) => {
    console.groupCollapsed('EnterRoom/CheckIn:');
    console.log(success('Results:', printJson(message)));
    console.groupEnd();
  });

  clientSocket.on('checkOut', (message) => {
    console.groupCollapsed('LeaveRoom/CheckOut:');
    console.log(success('Results:', printJson(message)));
    console.groupEnd();
  });

  // socket event handlers
  // e.g., on server: io.to(data.room).emit('checkIn')
  clientSocket.on('notifyRoom', (data, ack) => {
    // data can be on object or an array

    const { exposureDates, room, visitor } = data.length ? data[0] : data;

    let messageDates = groupBy({
      array: messages,
      prop: 'sentTime',
      val: 'visitor',
    });
    if (!Object.keys(messageDates).length) {
      alert(
        'UNEXEPECTED STATE: \nThere should be messages from the alerting Visitor.'
      );
      return;
    }
    console.log('messageDates:', report(messageDates));

    let alerts = new Map();
    // if only a single incoming date, make a Set with that
    // otherwise use the object for the Set
    let exposureDatesSet =
      typeof exposureDates == 'string'
        ? new Set().add(exposureDates)
        : new Set(exposureDates);

    console.log('Alert Dates', printJson(exposureDatesSet));
    console.log('Here are the necessary Exposure Alerts');
    exposureDatesSet.forEach((date) => {
      messageDates[moment(date).format('YYYY-MM-DD')].forEach((v) => {
        let phrase =
          v != visitor
            ? 'BE ADVISED: you may have been exposed to the virus'
            : 'CONFIRMING: you may have exposed others to the virus';
        let msg = `${v}, ${phrase} on date(s): ${moment(date).format('llll')}`;
        let alert = alerts.get(v);
        alerts.set(
          v,
          alert ? alert.concat(`, ${moment(date).format('llll')}`) : msg
        );
      });
    });

    // iterate the Map and emit alertVisitor event
    // Server will ensure a Visitor is online before forwarding event
    // otherwise, cache Visitor until they login again
    for (let [key, value] of alerts.entries()) {
      let message = {
        visitor: key,
        message: `${value}. To stop the spread, self-quarantine for 14 days.`,
        sentTime: new Date().toISOString(),
      };
      clientSocket.emit('alertVisitor', message, (ack) => {
        log.add(ack, 'alert');
      });
    }

    if (ack) ack(`${visitor}, ${room} alerted`);
  });

  // namespace broadcast event handlers
  // e.g., on server:     io.of(namespace).emit('updatedOccupancy')
  clientSocket.on('updatedOccupancy', (message) => {
    console.log(
      success(`${message.room} occupancy is now ${message.occupancy}`)
    );
  });

  return clientSocket;
}

module.exports = {
  OpenRoomConnection,
  exposeAvailableRooms,
  exposeOccupiedRooms,
};
