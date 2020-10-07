const io = require('socket.io-client');
const moment = require('moment');

const clientSocket = io('http://localhost:3003', {
  query: { token: 'room' },
});

// clientSocket.on('connect'...) is in the stateMachine so the event handler
// can run the model

clientSocket.on('disconnecting', () => {
  console.log('Disconnecting:', clientSocket.id, name);
});

// this test is driven from the socket.io server (when enabled)
clientSocket.on('notifyRoom', (data, ack) => {
  // data can be on object or an array

  const { exposureDates, room, visitor } = data.length ? data[0] : data;

  let messageDates = this.groupBy({
    array: this.messages,
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
    messageDates[moment(date).format(this.today)].forEach((v) => {
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
    this.emit({
      event: 'alertVisitor',
      message: {
        visitor: key,
        message: `${value}. To stop the spread, self-quarantine for 14 days.`,
        sentTime: new Date().toISOString(),
      },
      ack: (ack) => {
        this.log(ack, 'alert');
      },
    });
  }

  if (ack) ack(`${visitor}, ${room} alerted`);
  this.alertMessage = Object.keys(messageDates).length
    ? `Visitor warning triggered Exposure Alert for ${
        Object.keys(messageDates).length
      } exposure date(s) in ${room}.`
    : `Exposure Alert does not apply: No other visitor(s) to ${room} during exposure dates.`;
  this.alertColor = 'warning';
  this.alertIcon = 'mdi-home-alert';
  this.alert = true;
});
clientSocket.on('checkIn', (message) => console.log(message));
clientSocket.on('checkOut', (message) => console.log(message));
clientSocket.on('updatedOccupancy', (message) => {
  if (message.room == this.roomId) {
    // room.occupancy = message.occupancy;
  }
  console.log(`${message.room} occupancy is now ${message.occupancy}`);
});

const ClientSocket = clientSocket;

module.exports = { ClientSocket };
