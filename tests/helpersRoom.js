const moment = require('moment');

const { messages, exposureDatesSet } = require('./roomData.js');

function getAlerts(visitor) {
  // convert messages into alert map
  // Room will send an alert to each visitor in map

  let messageDates = groupBy({
    array: messages,
    prop: 'sentTime',
    val: 'visitor',
  });

  let alerts = new Map();
  // walk through the exposure dates from sick visitor..
  exposureDatesSet(visitor.visitor).forEach((date) => {
    //... looking for other visitors in the room on those exposure dates
    // remember, messageDates is grouped by visitor
    if (messageDates[moment(date).format('YYYY-MM-DD')]) {
      messageDates[moment(date).format('YYYY-MM-DD')].forEach((v) => {
        let phrase =
          v != visitor.visitor
            ? 'BE ADVISED: you may have been exposed to the virus'
            : 'CONFIRMING: you may have exposed others to the virus';
        let msg = `${v}, ${phrase} on date(s): ${moment(date).format('llll')}`;
        let alert = alerts.get(v);
        alerts.set(
          v,
          alert ? alert.concat(`, ${moment(date).format('llll')}`) : msg
        );
      });
    }
  });
  return alerts;
}

function groupBy(payload) {
  const { array, prop, val } = payload;

  return array
    .filter((v) => v[val]) // ignore Room Opened/Closed messages
    .reduce(function(a, c) {
      let key = moment(c[prop]).format('YYYY-MM-DD');
      if (!a[key]) {
        a[key] = [];
      }
      a[key].push(c[val]);
      return a;
    }, {});
}

module.exports = {
  getAlerts,
};
