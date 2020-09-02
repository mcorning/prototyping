<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row align="center">
        <v-col cols="8">{{ socketUrl }}</v-col>
        <v-col class="text-right">{{ ver }} </v-col>
      </v-row>

      <!-- <v-spacer></v-spacer>
      <span class="small">Room Manager: {{ managedRoom }}</span> -->
    </v-system-bar>
    <v-card dark>
      <v-card-title>Your Travel Diary</v-card-title>
      <v-card-subtitle
        >Log each Room you visit. Alert Rooms if you go into quarantine.
      </v-card-subtitle>
      <!-- <v-btn @click="testSocket">Ping</v-btn> -->

      <v-card-text>
        <v-row dense justify="space-between" align="center">
          <v-col cols="4">
            <v-combobox
              v-model="yourId"
              :items="names"
              label="Your ID"
              hint="Make this unique and pseudonymous"
            ></v-combobox>
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Visit Room"
            ></v-select>
          </v-col>
          <v-col class="text-center">
            {{ checkedOut ? 'Check-in' : 'Check-out' }}
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="act"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn>
          </v-col>
          <!-- <v-col cols="2"
            ><span>{{ occupancy }}</span>
          </v-col> -->
        </v-row>
        <v-card-actions>
          <v-btn color="error" block dark @click="warnRooms">
            Warn
            <v-icon>mdi-alert</v-icon> Rooms
          </v-btn>
        </v-card-actions>
        <v-card-actions>
          <v-banner v-if="dialog" class="text-center">
            At the moment, the Server doesn't know about you. Reconnect?
            <template v-slot:actions>
              <v-btn text color="secondary" @click="connectToServer">Yes</v-btn>
              <v-btn text color="secondary" @click="dialog = false">No</v-btn>
            </template>
          </v-banner>
        </v-card-actions>
        <v-card-text class="text-center mb-4">
          <v-alert
            :value="alert"
            dismissible
            border="left"
            :color="alertColor"
            elevation="2"
            colored-border
            icon="mdi-alert"
            transition="scale-transition"
            >{{ alertMessage }}
          </v-alert>
        </v-card-text>
      </v-card-text>
      <v-card-text>
        <v-list dense>
          <v-row align="center" dense>
            <v-col>
              <span
                >{{ daysBack == 0 ? 'Today' : 'All' }} {{ entered }} visits
              </span></v-col
            >
            <v-col cols="6">
              <v-checkbox
                :value="allVisits"
                label="See all visits"
                @change="toggleVisits"
              ></v-checkbox
            ></v-col>
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
        item-key="id"
        dense
        :items-per-page="5"
        class="elevation-1"
      >
        <template v-slot:item.sentTime="{ item }">
          {{ visitedDate(item.sentTime) }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';

import Message from '@/models/Message';
import Name from '@/models/Name';
import Room from '@/models/Room';
import State from '@/models/State';

// window.onerror = function(message, source, lineno, colno, error) {
window.onerror = function(message) {
  /// what you want to do with error here
  alert('onerror: ' + message);
};

export default {
  name: 'LctVisitor',
  components: {},

  computed: {
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
        return this.state?.yourId;
      },
      set(newVal) {
        // static changeYourId function on State model
        State.changeYourId(newVal);
        // static update function on Name model
        Name.update(newVal).catch((e) => console.log(e));
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
    dialog: true,
    alertIcon: '',
    alertColor: '',
    alert: false,
    alertMessage: '',
    occupancy: 1,
    socketId: '',

    // isConnected: false,
    ver: config.ver,
    cons: [],
    daysBack: 0,
    socketServerOnline: false,
    dataUrl: config.dataUrl,
    socketUrl: config.socketUrl,
    // socketUrl: config.ngrokUrl,
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
    roomIsAvailable(room) {
      this.log(`Available Room: ${room}`);
      Room.update(room);
    },

    exposureAlert(alertMessage) {
      this.log(alertMessage);
      this.alert = true;
      this.alertIcon = 'mdi-alert';
      this.alertColor = 'error';
      this.alertMessage = alertMessage;
      this.log(alertMessage);
    },
  },

  methods: {
    getEnteredMessages(room, v) {
      return v.room == room && v.message.toLowerCase() == 'entered';
    },

    // emit the exposureWarning to each Room occupied by Visitor
    emitExposureWarning(v) {
      {
        this.emit({
          event: 'exposureWarning',
          message: {
            room: v.room,
            message: v.sentTime,
            sentTime: new Date().toISOString(),
          },
          ack: (ack) => {
            this.alert = true;
            this.alertIcon = 'mdi-alert';
            this.alertColor = 'warning';
            this.alertMessage = ack;
          },
        });
      }
    },

    // Visitor groups all messages by Room.
    // Visitor iterates list sending an alertRoom event to socket.io server for each Room.
    // Alert payload contains all the dates for that Room.
    // Server relays message to each Room.
    warnRooms() {
      // Get unique list of visited Rooms
      new Set(this.messages.map((v) => v.room)).forEach((room) => {
        // for each Room...
        //...get the Room's 'entered' messages

        // WHY ARE WE GETTING TOO MANY WARNINGS SENT?

        let x = this.messages
          .filter((v) => this.getEnteredMessages(room, v))
          .map((v) => this.emitExposureWarning(v));
        // .catch((error) => {
        //   this.log(`Error :>> ${error}`);
        //   alert(`Error warning Rooms (${error}`);
        // });
        console.log(x);
      });
    },

    connectToServer() {
      this.dialog = false;
      // this is async, so let the connect() function set the isConnected property
      this.$socket.connect();
    },

    emit(payload) {
      if (!this.$socket.id) {
        this.dialog = true;
        return;
      }
      this.log(`emitting: ${payload.event}`);
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    addTestMessage() {
      // open up the message list beyond today
      this.daysBack = 14;
      // get a random number of days back for test data
      let days = this.getRandomInt(5);
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

    act() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
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
      event == 'enterRoom' ? this.occupancy++ : this.occupancy--;
      this.checkedOut = !this.checkedOut;
      let m = this.checkedOut ? 'out of' : 'into';
      this.log(`You checked ${m}  ${this.roomId}`);
    },

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },

    // helper methods
    log(msg) {
      this.cons.push({
        sentTime: moment(),
        message: msg,
      });
    },

    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
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
      if (this.daysBack == 0) {
        let m = `Deleting message ${id}`;
        this.log(m);
        Message.delete(id);
      } else {
        this.log(`Deleting all messages`);
        Message.deleteAll();
      }
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
  },

  watch: {
    roomId() {
      if (!this.checkedOut) {
        if (confirm('Should i act you out of', this.roomId, '?')) {
          this.checkedOut = !this.checkedOut;
          this.emit({
            event: 'leaveRoom',
            message: this.yourId,
            ack: (ack) => {
              let m = `Checked out of: ${ack}`;
              this.log(m);
            },
          });
        }
      }
    },
  },
  async created() {},

  async mounted() {
    let self = this;
    if (!self.socketId) {
      this.log('Connecting to Server...');
      self.connectToServer();
    } else {
      // we may need to refesh this vue's property if we come from the other vue
      this.socketId = this.$socket.id;
      self.log(`Mounted with socket ${self.socketId}`);
    }
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
