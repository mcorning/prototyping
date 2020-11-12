<template>
  <div>
    <systemBarTop>
      <v-col class="text-center">UA: {{ userAgent }}</v-col>
    </systemBarTop>

    <roomIntroCard />
    <roomIdentityCard @room="onHandleRoom($event)" @act="emit($event)" />
    <roomVisitorsCard :selectedRoom="selectedRoom" :log="log" />
    <systemBarBottom
      :socketMessage="socketMessage"
      :log="log"
    ></systemBarBottom>
    <auditTrailCard :cons="cons" />
    <v-card> </v-card>
  </div>
</template>

<script>
import moment from 'moment';

import helpers from '@/components/js/helpers.js';
const { printJson } = helpers;

import Message from '@/models/Message';
import Visitor from '@/models/Visitor';
import Room from '@/models/Room';
import State from '@/models/State';
import systemBarTop from '@/components/cards/systemBarTop';
import roomIntroCard from '@/components/cards/room/roomIntroCard';
import roomIdentityCard from '@/components/cards/room/roomIdentityCard';
import roomVisitorsCard from '@/components/cards/room/roomVisitorsCard';
import systemBarBottom from '@/components/cards/systemBarBottom';
import auditTrailCard from '@/components/cards/visitor/auditTrailCard';

window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + error.stack);
};

export default {
  name: 'LctRoom',
  components: {
    systemBarTop,
    roomIntroCard,
    roomIdentityCard,
    roomVisitorsCard,
    systemBarBottom,
    auditTrailCard,
  },
  computed: {
    getNow() {
      // const shortDateTimeFormat = 'lll';
      const timeFormat = 'HH:MM:SS';
      return moment().format(timeFormat);
    },

    userAgent() {
      let ua = navigator.userAgent;
      let userAgent;
      if (ua.includes('Edg')) {
        userAgent = 'Edge';
      } else if (ua.includes('Chrome')) {
        userAgent = 'Chrome';
      } else if (ua.includes('Firefox/82')) {
        userAgent = 'Firefox Dev';
      } else if (ua.includes('Firefox') || ua.includes('KHTML')) {
        userAgent = 'Firefox';
      } else {
        userAgent = 'Unknown ';
      }
      return userAgent;
    },

    roomisEmpty() {
      return !this.rooms.length;
    },

    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        this.log(`State gets${newVal}, but we don't use it...odd.`);
      },
    },

    rooms() {
      return Room.all().map((v) => v.selectedRoom.id);
    },

    managedRoom: {
      get() {
        return this.state?.managerId;
      },
      set(newVal) {
        State.updateManagerId(newVal);
      },
    },
    messages: {
      get() {
        return Message.all();
      },
      set(newVal) {
        // flatten newVal
        const msg = {
          room: newVal.room.room,
          visitor: newVal.visitor.visitor,
          roomId: newVal.room.id,
          visitorId: newVal.visitor.id,
          nsp: newVal.nsp,
          sentTime: newVal.sentTime,
          message: newVal.message,
        };
        // static update function on Message model
        Message.update(msg);
      },
    },
  },

  data: () => ({
    socketMessage: 'room',
    selectedRoom: { room: '', id: '' },
    search: '',

    rating: 3,
    deleting: false,
    dialog: false,
    alert: false,
    alertColor: 'error',
    alertMessage: '',
    alertIcon: 'mdi-alert',

    isConnected: false,
    cons: [],
    occupancy: 0,
    socketUri: '',
    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',
    closed: true,

    logHeaders: [
      { text: 'Message', value: 'message' },
      { text: 'Type', value: 'type' },
      { text: 'Sent  ', value: 'sentTime' },
    ],

    alerts: [],
    yourId: '',

    // Vuetify provides validation
    rules: {
      required: (value) => !!value || 'Required.',
      counter: (value) => {
        if (!value) {
          return false;
        }
        value?.length <= 20 || 'Max 20 characters';
      },
      nameDelimiter: (value) => {
        if (!value) {
          return false;
        }
        value.includes('.');
      },
      email: (value) => {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(value) || 'Invalid e-mail.';
      },
    },
  }),

  sockets: {
    // socket.io reserved events
    connect() {
      console.group('onConnect');
      console.log(
        `[${this.getNow}] ${printJson(this.$socket.id)} ${
          this.closed ? 'closed' : 'open'
        }`
      );

      if (this.$socket.io.opts?.query) {
        const { room, id, nsp, closed } = this.$socket.io.opts.query;
        console.log(`${room} ${closed ? 'closed' : 'open'}`);
        this.log(
          `Server connected using Id: ${id}, Room: ${room}, and nsp ${nsp} `,
          'Room.vue'
        );
      }
      console.groupEnd();
    },
    disconnect(reason) {
      this.log(`Disconnect: ${reason}`, 'Room.vue');
    },
    error(reason) {
      this.log(`Error ${reason}`, 'Room.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'Room.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'Room.vue');
    },
    reconnect(reason) {
      console.group('onReconnect');
      console.warn(
        `[${this.getNow}] ${printJson(
          this.$socket.io.opts.query
        )} Recconnect ${reason}`,
        'Room.vue'
      );
      this.log(`Recconnect ${reason}`, 'Room.vue');
      console.groupEnd();
    },
    reconnect_attempt(reason) {
      this.log(`Reconnect_attempt ${reason}`, 'Room.vue');
    },
    reconnecting(reason) {
      this.log(`Reconnecting ${reason}`, 'Room.vue');
    },
    reconnect_error(reason) {
      this.log(`Reconnect_error ${reason}`, 'Room.vue');
    },
    reconnect_failed(reason) {
      this.log(`Reconnect_failed ${reason}`, 'Room.vue');
    },
    // end socket.io reserved events

    // Visitor routine events
    checkIn(msg) {
      this.onCheckIn(msg);
    },

    checkOut(msg) {
      this.messages = msg;
    },
    // end socket.io reserved events

    // sent from Server after Visitor sends exposureWarning
    notifyRoom(data, ack) {
      const { exposureDates, room, visitor } = data;
      try {
        // filter messages for getMessageDates
        const messageDates = this.getMessageDates(
          data,
          this.messages.filter((v) => v.message == 'Entered')
        );
        console.log(`Visitor's exposure dates:`);
        console.log(printJson(exposureDates));

        exposureDates.forEach((date) => {
          if (messageDates[date]) {
            console.log(`${room} has other visitors on ${date}. Alerting now.`);
            messageDates[date].forEach((other) => {
              if (other.id == visitor.id) {
                this.log(
                  `${visitor.val2}, we sent an exposure alert to another occupant in ${room} on ${date}`,
                  'EVENT: notifyRoom'
                );
              } else {
                this.log(
                  `Alerting ${other.val2} that they were in ${room} on ${date}`,
                  'EVENT: notifyRoom'
                );
                const warning = {
                  visitor: other.val2,
                  visitorId: other.id,
                  message: `${other.val2}, to stop the spread, self-quarantine for 14 days.`,
                  sentTime: new Date().toISOString(),
                };

                this.$socket.emit('alertVisitor', warning, (result) => {
                  this.log(result, 'ACK: alertVisitor');
                });
              }
            });
          }
        });
        if (ack) ack(`${visitor}, ${room} alerted`);
      } catch (error) {
        // firewall: if, for any reason, exposureDates is not an array or messageDates have no entries...
        this.log(error, 'ERROR: notifyRoom');
      } finally {
        console.groupEnd();
      }
    },

    // end sockets:
  },

  // Emitters:   Visitor            Server        Room
  // Handlers:   Server             Room          Serveer         Visitor
  // Event path: exposureWarning -> notifyRoom -> alertVisitor -> exposureAlert

  // Room handles notifyRoom event from Server
  //   * based on data in exposureWarning from Visitor
  //       * Visitor object
  //       * collection of Room/dates
  // exposureAlert contains a primary message to the Visitors:
  //    * the Visitor who issued the exposureWarning sees a confirmation message,
  //    * the other Visitor(s) receive
  //       * a message recommending self-quarantine
  //       * a packet of dates of possible exposure that is stored in the Visitor log

  // Room emits alertVisitor to Server sending
  //    * a Visitor object composed of data received when Visitors entered Room
  //         * visitor:   nickname of Visitor
  //         * visitorId: Visitor's generated ID

  methods: {
    onCheckIn(msg) {
      this.messages = msg;
    },

    groupMessagesByDateAndVisitor(payload) {
      const { array, prop, val, val2 } = payload;

      return array.reduce(function(a, c) {
        let key = moment(c[prop]).format('YYYY-MM-DD');
        if (!a[key]) {
          a[key] = [];
        }
        a[key].push({ id: c[val], val2: c[val2] });
        return a;
      }, {});
    },

    getMessageDates(data, messages) {
      console.groupCollapsed(
        `[${this.getNow}] Room Client: onNotifyRoom, Server Acknowledged:`
      );
      console.log('Input data:');
      console.log(printJson(data));
      let messageDates = this.groupMessagesByDateAndVisitor({
        array: messages,
        prop: 'sentTime',
        val: 'visitorId',
        val2: 'visitor',
      });
      console.log('Room Entered message dates:');
      console.log(printJson(messageDates));
      return messageDates;
    },

    //#region - other methods
    refreshConnection(hard) {
      window.location.reload(hard);
    },

    getTextColor(type) {
      return type == 'alert' ? 'red--text' : '';
    },

    getIconColor(type) {
      return type == 'alert' ? 'red' : 'gray';
    },

    groupBy(payload) {
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
    },
    // main methods
    // openMyRoom(roomId) {
    //   let payload = {
    //     event: 'openMyRoom',
    //     message: roomId,
    //     ack: (ack) => {
    //       this.log(ack);
    //       this.alertColor = 'success';
    //       this.alertMessage = ack;
    //       this.alertIcon = 'mdi-email-open';
    //       this.alert = true;
    //     },
    //   };
    //   this.$socket.emit(payload.event, payload.message, payload.ack);
    // },

    changeRoom(val) {
      let msg;
      if (!val || this.rooms.length > 1) {
        msg = {
          room: this.selectedRoom.id,
          // TODO why deleted?
          message: val ? 'Closed' : 'Deleted',
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'closeRoom',
          message: msg,
          ack: (ack) => {
            // TODO why length?
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = val ? 'success' : 'warning';
            this.alert = true;
            this.log(`Closed Room ${this.selectedRoom.id}`);
          },
        });
      }
      if (val && this.rooms.length) {
        msg = {
          room: this.selectedRoom.room,
          id: this.selectedRoom.id,
          message: 'Opened',
          state: this.closed,
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'openRoom',
          message: msg,
          ack: (ack) => {
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = 'success';
            this.alert = true;
            this.log('Opened Room');
          },
        });
      }
    },

    reset() {
      this.deleting = false;
    },
    // handles the act event from roomIdentityCard (and any later $socket.emit calls)
    // attempts reconnect, if necessary
    emit(payload) {
      if (!this.$socket.id) {
        this.connectToServer();
      }
      // open or closed
      this.$socket.io.opts.query.state = payload.message.message;
      this.closed = payload.message.message;
      let msg =
        `Emitting ${payload.event}` +
        (payload.message.room ? ` to server for ${payload.message.room}` : '');
      this.log(msg);
      this.$socket.emit(payload.event, payload.message, (ack) => {
        this.log(ack, 'ACKS');
      });
    },

    // end main methods

    // helper methods
    disconnectFromServer() {
      console.log('Disconnection from Server');
      this.$socket.disconnect(true); // passing true closes underlying connnection
    },

    log(msg, type = 'info') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },

    pingServer() {
      this.log(`Using socket ${this.$socket.id}...`);
      this.emit({
        event: 'pingServer',
        message: this.selectedRoom.id,
        ack: (ack) => '...' + this.log(ack),
      });
    },

    // TODO candidate for utility code
    isToday(date) {
      let x = moment(date).format(this.today);
      let y = moment()
        .add(-this.daysBack, 'day')
        .format(this.today);
      return x == y;
    },

    isBetween(date) {
      let visit = moment(date);

      let past = moment()
        .add(-this.daysBack, 'day')
        .format('YYYY-MM-DD');
      let tomorrow = moment()
        .add(1, 'day')
        .format('YYYY-MM-DD');
      let test = visit.isBetween(past, tomorrow);
      return test;
    },

    // end helper methods
    socketInfo() {
      if (this.$socket.disconnected) {
        return 'Connecting...';
      }

      const query = this.$socket.io.opts?.query;
      if (!query) {
        return `${this.$socket.id} isn't yours. Restart app.`;
      }

      const { id, nsp, room } = query;
      const info = `${nsp} ${id} ${room}`;
      return info;
    },

// this sets the query object that includes data about the state of the UI;
// namely, is the Room open or closed? by default, it's closed.
// but emit() updates this with the message sent by the roomIdentityCard
    connectToServer() {
      // this.log('Connecting to Server...');
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != this.selectedRoom.id
      ) {
        this.$socket.disconnect();
      }
      this.$socket.io.opts.query = {
        room: this.selectedRoom.room,
        id: this.selectedRoom.id,
        closed: this.closed,
        nsp: 'enduringNet',
      };
      this.$socket.connect();
    },

    onHandleRoom(room) {
      this.selectedRoom = room;
      this.connectToServer();
    },

    findRoomWithId(id = this.selectedRoom?.id) {
      let r = Room.find(id) || '';
      return r;
    },

    selectedRoomInit() {
      let x = State.find(0);
      let id = x?.roomId;
      let r = this.findRoomWithId(id);
      if (r) {
        this.selectedRoom = r;
      } else {
        this.selectedRoom = { room: '', id: '' };
      }
      this.connectToServer();
    },
    //#endregion
  },

  async created() {},

  async mounted() {
    await Message.$fetch();
    await Room.$fetch();
    await Visitor.$fetch();
    await State.$fetch();
    this.selectedRoomInit();

    // log the useragent in case we can't recognize it
    this.log(navigator.userAgent);
    console.log('Room.vue mounted');
  },
};
</script>
