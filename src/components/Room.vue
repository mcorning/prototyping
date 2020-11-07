<template>
  <v-container>
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
  </v-container>
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
  alert('onerror: ' + message);
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
    // roomId: {
    //   get() {
    //     // state will be null at first
    //     // but second call should have value.
    //     // somewhere, when rooms is empty, '
    //     // the system wants to return the string 'null'
    //     // and we want an empty string
    //     // so it is written
    //     // so it shall be done
    //     let roomId = this.state?.roomId;
    //     if (roomId) {
    //       // roomId isn't yet available to methods, so pass the arg here explicitly
    //       this.openMyRoom(roomId);
    //     }
    //     return roomId;
    //   },
    //   set(newVal) {
    //     // if we have a newVal, use it
    //     if (newVal) {
    //       // static update function on Room model
    //       Room.update(newVal).catch((e) => console.log(e));
    //       this.openMyRoom(newVal);
    //     }
    //     // else delete the last used roomId (then delete the roomId in state)
    //     else {
    //       Room.delete(this.roomId).then((r) => console.log('rooms', r));
    //     }
    //     // change the roomId after we don't need the old value
    //     // (e.g., when deleting a Room from IndexDB)
    //     // static changeRoomId function on State model
    //     State.changeRoomId(newVal);
    //   },
    // },
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
        // static update function on Message model
        Message.update(newVal);
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
      this.messages = JSON.stringify(msg, null, 2);
    },

    checkOut(msg) {
      this.messages = msg;
    },
    // end socket.io reserved events

    // Room event handlers
    // Server sent notifyRoom (because Server received exposureWarning from Visitor)
    // Room takes over and sends Server an alertVisitor event to all effected Visitors
    notifyRoom(data, ack) {
      this.alert = false;
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

      // walk through the exposure dates from sick visitor..
      exposureDatesSet.forEach((date) => {
        //... looking for other visitors in the room on those exposure dates
        // remember, messageDates is grouped by visitor
        messageDates[moment(date).format(this.today)]?.forEach((v) => {
          let phrase =
            v != visitor
              ? 'BE ADVISED: you may have been exposed to the virus'
              : 'CONFIRMING: you may have exposed others to the virus';
          let msg = `${v}, ${phrase} on date(s): ${moment(date).format(
            'llll'
          )}`;
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
    },

    // used for UI only == Visitors.vue only
    // updatedOccupancy(payload) {
    //   if (payload.room == this.roomId) {
    //     this.occupancy = payload.occupancy;
    //   }
    //   this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    // },
  },

  methods: {
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
      let id = x.roomId;
      let r = this.findRoomWithId(id);
      this.selectedRoom = r;
      this.connectToServer();
    },
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
