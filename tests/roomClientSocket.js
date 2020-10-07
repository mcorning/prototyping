const { groupBy, log, messages } = require('./helpersRoom');

const io = require('socket.io-client');
const moment = require('moment');
const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

function OpenRoomConnection(token) {
  // does the server still open a room for toke?
  const clientSocket = io('http://localhost:3003', {
    query: { token: token },
  });

  clientSocket.on('connect', () => {
    console.log(highlight('Room Socket.io Client ID:', clientSocket.id));
  });
  clientSocket.on('disconnecting', () => {
    console.log('Disconnecting:', clientSocket.id, name);
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
    console.log('messageDates:', messageDates);

    let alerts = new Map();
    // of only a single incoming date, make a Set with that
    // otherwise use the object for the Set
    let exposureDatesSet =
      typeof exposureDates == 'string'
        ? new Set().add(exposureDates)
        : new Set(exposureDates);

    console.log('Alert Dates', exposureDatesSet);
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
        log(ack, 'alert');
      });
    }

    // if (ack) ack(`${visitor}, ${room} alerted`);
    // this.alertMessage = Object.keys(messageDates).length
    //   ? `Visitor warning triggered Exposure Alert for ${
    //       Object.keys(messageDates).length
    //     } exposure date(s) in ${room}.`
    //   : `Exposure Alert does not apply: No other visitor(s) to ${room} during exposure dates.`;
    // this.alertColor = 'warning';
    // this.alertIcon = 'mdi-home-alert';
    // this.alert = true;
  });
  clientSocket.on('checkIn', (message) => console.log(message));
  clientSocket.on('checkOut', (message) => console.log(message));

  // namespace broadcast event handlers
  // e.g., on server:     io.of(namespace).emit('updatedOccupancy')
  clientSocket.on('updatedOccupancy', (message) => {
    console.log(`${message.room} occupancy is now ${message.occupancy}`);
  });

  return clientSocket;
}

module.exports = { OpenRoomConnection };
