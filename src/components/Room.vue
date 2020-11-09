<template>
  <div>
    <systemBarTop>
      <v-col class="text-center">UA: {{ userAgent }}</v-col>
    </systemBarTop>

    <roomIntroCard />
    <roomIdentityCard @room="handleRoom($event)" @act="emit($event)" />
    <roomVisitorsCard :selectedRoom="selectedRoom" :log="log" />
    <systemBarBottom
      :socketMessage="socketMessage"
      :log="log"
    ></systemBarBottom>
    <auditTrailCard :cons="cons" />

    <v-card>
      <!-- <v-card-title>Audit Trail</v-card-title>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        :search="search"
        :headers="logHeaders"
        :items="cons"
        group-by="type"
        :sort-by="['sentTime', 'type']"
        :sort-desc="[true, false]"
        multi-sort
        must-sort
        item-key="id"
        dense
        :items-per-page="15"
        class="elevation-1"
      >
        <template v-slot:item.message="{ item }">
          <v-card flat :class="getTextColor(item.type)">
            {{ item.message }}
          </v-card>
        </template>
        <template v-slot:item.sentTime="{ item }">
          <v-card flat min-width="200" class="text-right">
            {{ visitedDate(item.sentTime) }}</v-card
          >
        </template>
        <template v-slot:item.type="{ item }">
          <v-icon :color="getIconColor(item.type)">mdi-{{ item.type }}</v-icon>
        </template>
      </v-data-table>
      <div class="text-center">
        How are we doing on the Room experience?
        <v-rating
          v-model="rating"
          background-color="primary lighten-3"
          color="primary"
          large
        ></v-rating>
      </div> -->
    </v-card>
  </div>
</template>

<script>
import moment from 'moment';

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
    selectedRoom: {},
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
    socketId: '',
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
      if (this.$socket.io.opts?.query) {
        const { room, id, nsp } = this.$socket.io.opts.query;
        this.log(
          `Server connected using Id: ${id}, Room: ${room}, and nsp ${nsp} `,
          'Room.vue'
        );
        this.socketId = id;
      }
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
      this.log(`Recconnect ${reason}`, 'Room.vue');
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
      this.messages = msg;
    },

    checkOut(msg) {
      this.messages = msg;
    },
    // end socket.io reserved events

    // sent from Server after Visitor sends exposureWarning
    notifyRoom(data, ack) {
      const { exposureDates, room, visitor } = data;
      // console.groupCollapsed(
      //   `[${this.getNow}] Room Client: onNotifyRoom, Server Acknowledged:`
      // );
      // console.log('Input data:');
      // console.table(data);
      // let messageDates = this.groupMessagesByDateAndVisitor({
      //   array: this.messages,
      //   prop: 'sentTime',
      //   val: 'visitorId',
      // });
      // console.log(`Room's grouped messages:`);
      // console.table(messageDates);

      // filter messages for getMessageDates
      const messageDates = this.getMessageDates(
        data,
        this.messages.filter((v) => v.message == 'Entered')
      );
      exposureDates.forEach((date) => {
        // list all visitors on this date
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
      });
      console.groupEnd();
      // use visitor.vistor is you use object visitor in Message
      // else visitor
      if (ack) ack(`${visitor}, ${room} alerted`);
    },

    // end sockets:
  },

  methods: {
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
      console.table(data);
      let messageDates = this.groupMessagesByDateAndVisitor({
        array: messages,
        prop: 'sentTime',
        val: 'visitorId',
        val2: 'visitor',
      });
      console.log(`Room's grouped messages:`);
      console.table(messageDates);
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
          message: val ? 'Closed' : 'Deleted',
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'closeRoom',
          message: msg,
          ack: (ack) => {
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
        nsp: 'enduringNet',
      };
      this.$socket.connect();
    },

    handleRoom(room) {
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
      this.selectedRoom = r;
      this.connectToServer();
    },
    //#endregion

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
