<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row align="center">
        <v-col class="text-left">{{ $socket.io.uri }}</v-col>
        <v-col class="text-center">UA: {{ userAgent }}</v-col>
        <v-col class="text-right">
          <v-btn text @click="refreshConnection(true)">{{
            $build
          }}</v-btn></v-col
        >
      </v-row>

      <!-- <v-spacer></v-spacer>
      <span class="small">Room Manager: {{ managedRoom }}</span> -->
    </v-system-bar>
    <v-card dark>
      <v-card-title>Your Travel Diary</v-card-title>
      <v-card-subtitle
        >Log each Room you visit. Warn Rooms if you quarantine.
      </v-card-subtitle>
      <!-- <v-btn @click="testSocket">Ping</v-btn> -->

      <v-card-text>
        <v-row dense justify="space-between">
          <v-col cols="3">
            <v-combobox
              v-if="names.length"
              v-model="yourId"
              :items="names"
              label="Your ID"
              hint="Must be unique"
              clearable
            ></v-combobox>

            <v-text-field
              v-else
              label="Your ID"
              @change="addYourId"
            ></v-text-field>
          </v-col>

          <v-col cols="3">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Visit Room"
              @change="changingRoom = true"
            ></v-select>
          </v-col>
          <v-col cols="2">
            <v-text-field label="Occupancy" :value="occupancy"></v-text-field>
          </v-col>
          <v-col>
            <div v-show="roomIsReadyToEnter" class="text-center">
              {{ checkedOut ? 'Check-in' : 'Check-out' }}
              <v-btn
                :color="checkedOut ? 'success' : 'warning'"
                fab
                dark
                @click="act(roomId)"
              >
                <v-icon>{{ btnType }}</v-icon>
              </v-btn>
            </div>
            <v-card v-if="firstTime">
              <v-card-title>First Time?</v-card-title>
              <v-card-text
                >Enter your name in the Your ID field. We enable more than one
                person to use the same instance of the app or device. You can
                delete an entry with the X button.</v-card-text
              >
              <v-card-text
                >You can only visit an open Room. The Room dropdown gets its
                values from the Server.</v-card-text
              >
              <v-card-text
                >When you see the Room you want is open, select it.</v-card-text
              >
              <v-card-text
                >A selected room enables your Check-in button.</v-card-text
              >
            </v-card>
          </v-col>
        </v-row>

        <v-card-actions>
          <v-banner v-if="disconnected" class="text-center">
            At the moment, the Server doesn't know about you. Reconnect?
            <template v-slot:actions>
              <v-btn text color="secondary" @click="connectToServer">Yes</v-btn>
              <v-btn text color="secondary" @click="disconnected = false"
                >No</v-btn
              >
            </template>
          </v-banner>
          <v-banner
            v-if="changingRoom === 1"
            color="primary"
            class="text-center"
          >
            Do you want to enter {{ roomId }} now?
            <template v-slot:actions>
              <v-btn text color="secondary" @click="changeRoom">Yes</v-btn>
              <v-btn text color="secondary" @click="doNotChangeRoom">No</v-btn>
            </template>
          </v-banner>
        </v-card-actions>
        <v-card-text class=" mb-4">
          <v-alert
            :value="alert"
            light
            dismissible
            border="left"
            :color="alertColor"
            elevation="5"
            colored-border
            :icon="alertIcon"
            transition="scale-transition"
            >{{ alertMessage }}
          </v-alert>
        </v-card-text>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="error"
          block
          dark
          @click="warnRooms"
          :disabled="!messages.length"
        >
          Warn
          <v-icon>mdi-home-alert</v-icon> Rooms
        </v-btn>
      </v-card-actions>
      <v-card-text>
        <v-list dense>
          <v-row align="center" justify="space-between" dense>
            <v-col cols="5">
              <span
                >{{ daysBack == 0 ? 'Today' : 'All' }} {{ entered }} visits
              </span></v-col
            >
            <v-col>
              <div class="text-center">
                <v-checkbox
                  :value="allVisits"
                  label="See all visits"
                  @change="toggleVisits"
                ></v-checkbox></div
            ></v-col>

            <v-col>
              <div class="text-center">
                <v-btn
                  fab
                  color="primary"
                  small
                  @click="refreshConnection(false)"
                  ><v-icon>mdi-email-sync-outline</v-icon></v-btn
                >
              </div>
            </v-col>
            <v-col>
              <div class="text-center">
                <v-btn
                  color="warning"
                  :disabled="!allVisits || !messages.length"
                  @click="deleteAllMessages"
                  >Delete all visits</v-btn
                >
              </div></v-col
            >
          </v-row>
          <v-data-table
            :headers="messageHeaders"
            :items="visits"
            multi-sort
            item-key="id"
            dense
            :items-per-page="5"
            class="elevation-1"
          >
            <template v-slot:item.sentTime="{ item }">
              {{ visitedDate(item.sentTime) }}
            </template>
            <template v-slot:item.action="{ item }">
              <v-icon @click="deleteMessage(item.id)">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-list>
      </v-card-text>
    </v-card>
    <v-system-bar color="secondary">
      <v-row align="center">
        <v-col cols="10">Socket: {{ $socket.id }}</v-col>
        <v-col cols="2" class="text-right"
          ><v-btn @click="addTestMessage" text
            ><v-icon>mdi-test-tube</v-icon></v-btn
          >
        </v-col>
      </v-row>
    </v-system-bar>
    <v-card>
      <v-card-title>Audit Trail</v-card-title>
      <v-data-table
        :headers="logHeaders"
        :items="cons"
        multi-sort
        must-sort
        :sort-by="['sentTime', 'type']"
        :sort-desc="[true, false]"
        calculate-widths
        item-key="id"
        dense
        :items-per-page="15"
        group-by="type"
        class="elevation-1"
      >
        <template v-slot:item.message="{ item }">
          <v-card flat min-width="200" :class="getColor(item.type)">
            {{ item.message }}</v-card
          >
        </template>
        <template v-slot:item.sentTime="{ item }">
          <v-card flat min-width="200" :class="getColor(item.type)">
            {{ visitedDate(item.sentTime) }}</v-card
          >
        </template>
        <template v-slot:item.type="{ item }">
          <v-icon :color="getColor(item.type)">mdi-{{ item.type }}</v-icon>
        </template>
      </v-data-table>
      <div class="text-center">
        How are we doing on the Visiter experience?
        <v-rating
          v-model="rating"
          background-color="primary lighten-3"
          color="primary"
          large
        ></v-rating>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import moment from 'moment';

import Message from '@/models/Message';
import Name from '@/models/Name';
import Room from '@/models/Room';
import State from '@/models/State';

// window.onerror = function(message, source, lineno, colno, error) {
window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + message);
};
export default {
  name: 'LctVisitor',
  components: {},

  computed: {
    userAgent() {
      let ua = navigator.userAgent;
      let userAgent;
      if (ua.includes('Edg')) {
        userAgent = 'Edge';
      } else if (ua.includes('Firefox/82')) {
        userAgent = 'Firefox Dev';
      } else if (ua.includes('Firefox/80')) {
        userAgent = 'Firefox';
      } else if (ua.includes('Chrome')) {
        userAgent = 'Chrome';
      } else {
        userAgent = 'Unknown ';
      }
      return userAgent;
    },

    exposureWarnings() {
      if (!this.messages.length) return {};
      let payload = {
        array: this.messages,
        prop: 'room',
        val: 'sentTime',
      };
      return this.groupBy(payload);
    },

    firstTime() {
      return !this.names.length;
    },

    roomIsReadyToEnter() {
      return this.rooms.includes(this.roomId) && this.yourId;
    },

    allVisits() {
      return this.daysBack != 0;
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

    yourId: {
      get() {
        let yourId = this.state?.yourId;
        if (yourId) {
          // yourId isn't yet available to methods, so pass the arg here explicitly
          this.openMyRoom(yourId);
        }
        return yourId;
      },
      set(newVal) {
        if (newVal) {
          // static update function on Name model
          Name.update(newVal).catch((e) => console.log(e));
          this.openMyRoom(newVal);
        } else {
          Name.delete(this.yourId);
        }

        // static changeYourId function on State model
        State.changeYourId(newVal);
      },
    },

    roomId: {
      get() {
        return this.state?.roomId;
      },
      set(newVal) {
        // static changeRoomId function on State model
        State.changeRoomId(newVal);
        // static update function on Room model
        Room.update(newVal).catch((e) => console.log(e));
      },
    },

    managedRoom: {
      get() {
        return this.state?.managerId;
      },
      set(newVal) {
        State.updateManagerId(newVal);
      },
    },
    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        console.log(newVal);
      },
    },

    rooms() {
      return Room.all().map((v) => v.roomId);
    },

    names() {
      return Name.all().map((v) => v.yourId);
    },

    visits() {
      let allVisits = this.messages.filter((v) => this.isBetween(v.sentTime));
      if (this.daysBack == 0) {
        return allVisits.filter((v) => this.roomId == v.room);
      }
      return allVisits;
    },
    entered() {
      return this.visits.filter((v) => v.message == 'Entered').length;
    },
    departed() {
      return this.visits.filter((v) => v.message == 'Departed').length;
    },
    btnType() {
      return this.checkedOut ? 'mdi-account-plus' : 'mdi-account-minus';
    },
  },

  data: () => ({
    oldRoomId: '',
    changingRoom: false,
    rating: 3,
    disconnected: true,
    alertIcon: 'mdi-alert',
    alertColor: '',
    alert: false,
    alertMessage: '',
    occupancy: 0,
    socketId: '',

    // isConnected: false,
    cons: [],
    daysBack: 0,
    socketServerOnline: false,
    visitFormat: 'HH:mm on ddd, MMM DD',
    checkedOut: true,
    messageHeaders: [
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Delete', value: 'action' },
    ],
    logHeaders: [
      { text: 'Message', value: 'message' },
      { text: 'Type', value: 'type' },
      { text: 'Sent  ', value: 'sentTime' },
    ],
  }),

  sockets: {
    // socket.io reserved events
    connect() {
      this.socketId = this.$socket.id;
      this.log(`Server connected on socket ${this.socketId}`);
    },

    disconnect() {
      this.log(
        'The server disconnected your socket (probably because you refreshed the browser).'
      );
    },
    message(msg) {
      this.log(msg);
    },
    // pong() {
    //   this.log('Server ponged ');
    // },

    // end socket.io reserved events
    // Server fires this event when a Room opens/closes
    availableRoomsExposed(rooms) {
      Room.$deleteAll();
      console.assert(
        this.rooms.length == 0,
        'Should have no rooms before update'
      );
      rooms.forEach((room) => {
        Room.update(room.name);
      });
    },

    exposureAlert(alertMessage) {
      this.log(alertMessage, 'alert');
      this.alert = true;
      this.alertIcon = 'mdi-alert';
      this.alertColor = 'error';
      this.alertMessage = alertMessage;
    },

    updatedOccupancy(payload) {
      if (payload.room == this.roomId) {
        this.occupancy = payload.occupancy;
      }
      this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    },
  },

  methods: {
    refreshConnection(hard) {
      window.location.reload(hard);
    },

    getColor(type) {
      return type == 'alert' ? 'red--text' : '';
    },

    // this is a (more?) functional way to do grouping
    groupByFn(arr, fn) {
      return arr
        .map(typeof fn === 'function' ? fn : (val) => val[fn])
        .reduce((acc, val, i) => {
          acc[val] = (acc[val] || []).concat(arr[i]);
          return acc;
        }, {});
    },

    groupBy(payload) {
      const { array, prop, val } = payload;

      return array.reduce(function(acc, obj) {
        let key = obj[prop];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj[val]);
        return acc;
      }, {});
    },

    // Server on.connection() does not know the name of the new connection.
    // So we fire this event right after connection is made to pass the name of the room to the server.
    // The Server needs this name to alert Visitors.
    openMyRoom(yourID) {
      let payload = {
        event: 'openMyRoom',
        message: yourID,
        ack: (ack) => {
          this.log(ack);
          // this.alertColor = 'success';
          // this.alertMessage = ack;
          // this.alertIcon = 'mdi-email-open';
          // this.alert = true;
        },
      };
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    addYourId(val) {
      this.yourId = val;
    },

    // Visitor groups all messages by Room.
    // Visitor iterates list sending an alertRoom event to socket.io server for each Room.
    // Alert payload contains all the dates for that Room.
    // Server relays message to each Room.
    warnRooms() {
      // // reset, if necessary, alert so we can hit the warn rooms more than once, if necessary.
      this.alert = false;
      // returns something like this:
      // exposureWarnings = {
      //   visitor: 'Michael',
      //   warnings: {
      //     'Fika.Outside': ['2020-09-21T05:49:49.352Z'],
      //   },
      //   sentTime: '2020-09-21T05:51:18.558Z',
      // };

      console.table(this.exposureWarnings);
      this.log(
        `Warning: ${Object.entries(this.exposureWarnings)
          .toString()
          .split(',')
          .join(', ')}`,
        'alert'
      );

      this.emit({
        event: 'exposureWarning',
        message: {
          visitor: this.yourId,
          warnings: this.exposureWarnings,
          sentTime: new Date().toISOString(),
        },
        ack: (ack) => {
          this.alert = true;
          this.alertIcon = 'mdi-alert';
          this.alertColor = 'warning';
          this.alertMessage = ack;
        },
      });
    },

    getEnteredMessages(room, v) {
      return v.room == room && v.message.toLowerCase() == 'entered';
    },

    // emit the exposureWarning to each Room occupied by Visitor
    emitExposureWarning(v) {
      this.log(
        `Warned ${v.room} of exposure on ${moment(v.sentTime).format('llll')}`
      );
      this.emit({
        event: 'exposureWarning',
        message: {
          room: v.room,
          message: v.sentTime,
          sentTime: v.sentTime,
        },
        ack: (ack) => {
          this.alert = true;
          this.alertIcon = 'mdi-alert';
          this.alertColor = 'warning';
          this.alertMessage = ack;
        },
      });
    },

    connectToServer() {
      this.disconnected = false;
      // this is async, so let the connect() function set the isConnected property
      this.$socket.connect();
    },

    emit(payload) {
      if (!this.$socket.id) {
        this.disconnected = true;
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    addTestMessage() {
      // open up the message list beyond today
      this.daysBack = 14;
      // get a random number of days back for test data
      let days = this.getRandomIntBetween(2, 4);
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Entered',
        sentTime: moment()
          .add(-days, 'day')
          .toISOString(),
      };
      // cache the message in IndexedDB
      this.messages = msg;
      // log the test data
      this.log(JSON.stringify(msg));
      this.emit({
        event: 'enterRoom',
        message: msg,
      });
    },

    act(roomId = this.roomId) {
      let msg = {
        visitor: this.yourId,
        room: roomId,
        message: this.checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.checkedOut ? 'enterRoom' : 'leaveRoom';

      this.emit({
        event: event,
        message: msg,
        ack: (ack) => {
          this.log(ack.message);
        },
      });
      this.checkedOut = !this.checkedOut;
      let m = this.checkedOut ? 'out of' : 'into';
      this.log(`You checked ${m}  ${roomId}`);
    },

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },

    // helper methods
    log(msg, type = 'information') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },

    getRandomIntBetween(min, max) {
      // return Math.floor(Math.random() * Math.floor(max))-1;
      return Math.random() * (max - min) + min;
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },

    // handleMessage(msg) {
    //   this.messages = msg;
    //   if (msg.message == 'Alert') {
    //     let alertMsg = `A fellow visitor to ${msg.room} is in quarantine at ${msg.sentTime}`;
    //     alert(`handleMessage:`, alertMsg);
    //   }
    // },

    removeVisitor() {
      // the server will remove this socket
      this.emit({ event: 'removeVisitor' });
    },

    deleteMessage(id) {
      let m = `Deleting message ${id}`;
      this.log(m);
      Message.delete(id);
    },

    deleteAllMessages() {
      this.log(`Deleting all messages`);
      Message.deleteAll();
      this.refreshConnection(true);
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

    testSocket(event) {
      // this.$socket.emit(event, 'data');
      this.pingServer(event);
    },

    pingServer() {
      // Send the "pingServer" event to the server.
      // this.log(`this.isConnected: ${this.isConnected}`);
      this.log(`Using socket ${this.$socket.id}...`);
      this.$socket.emit('pingServer', this.roomId, (ack) =>
        this.log('...' + ack)
      );
      // this.log('pinging server');
      // this.$socket.emit('ping');
    },

    changeRoom() {
      this.changingRoom = 0;
      if (this.oldRoomId) {
        this.checkedOut = false;
        // will act on roomId. which one?
        this.act(this.oldRoomId);
      }
      this.checkedOut = true;
      this.act();
    },
    doNotChangeRoom() {
      // this.checkedOut = !this.checkedOut;
      this.roomId = this.oldRoomId || this.roomId;
      this.changingRoom = -1;
    },
  },

  watch: {
    roomId(newRoomId, oldRoomId) {
      if (this.changingRoom === -1) {
        this.changingRoom = 0;
        return;
      }
      this.oldRoomId = oldRoomId;
      if (newRoomId || oldRoomId) {
        this.changingRoom = 1;
      }
    },
  },
  async created() {
    let self = this;
    if (!self.socketId) {
      this.log('Connecting to Server...');
      self.connectToServer();
    } else {
      // we may need to refesh this vue's property if we come from the other vue
      this.socketId = this.$socket.id;
      self.log(`Mounted with socket ${self.socketId}`);
    }
  },

  async mounted() {
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
    this.$socket.emit('exposeAvailableRooms');
    this.log(navigator.userAgent);
  },
};
</script>
