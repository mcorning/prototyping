const moment = require('moment');
const { groupBy, log, printJson, report } = require('./helpers');

const { messages, exposureDatesSet } = require('./visitorData');

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

module.exports = {
  getAlerts,
  groupBy,
  messages,
  report,
  printJson,
  log,
};
