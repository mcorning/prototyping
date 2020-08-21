<template>
  <v-container>
    <v-card dark>
      <v-card-title>Your Travel Diary</v-card-title>
      <v-card-subtitle
        >Record each you visit. If you go into quarantine, Alert
        Rooms</v-card-subtitle
      >
      <v-card-text>
        <v-row dense>
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
          <v-col cols="3">
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="check"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn>
            <span class="pl-3">{{
              checkedOut ? 'Check-in' : 'Check-out'
            }}</span>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-btn color="error" block dark @click="alertRooms">
            Alert
            <v-icon>mdi-alert</v-icon> Rooms
          </v-btn>
        </v-card-actions>
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
      <v-icon small>mdi-transit-connection-variant </v-icon>
      <span
        >Socket URL:{{ socketUrl }}:
        {{ socketServerOnline ? 'online' : 'offline' }}</span
      >

      <v-spacer></v-spacer>
      <span>Room Manager: {{ managedRoom }}</span>
      <v-spacer></v-spacer>
      <v-btn small text @click="test">Test</v-btn>
    </v-system-bar>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';

import io from 'socket.io-client';
const socket = io(config.socketUrl);

import Message from '@/models/Message';
import Name from '@/models/Name';
import Room from '@/models/Room';
import State from '@/models/State';

socket.on('alert', (msg) => {
  alert('alert', msg);
});
socket.on('exposureAlert', (msg) => {
  alert('Exposure Alert\n' + JSON.stringify(msg));
});

export default {
  name: 'LctVisitor',
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
    daysBack: 0,
    socketServerOnline: false,
    dataUrl: config.dataUrl,
    socketUrl: config.ngrokUrl,
    visitFormat: 'HH:mm, ddd, MMM DD',
    checkedOut: true,
    socketId: '',
    messageHeaders: [
      // { text: 'Id', value: 'id' },
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Delete', value: 'action' },
    ],
  }),

  methods: {
    test() {
      this.daysBack = 14;
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Entered',
        sentTime: moment()
          .add(-this.getRandomInt(3), 'day')
          .toISOString(),
      };
      // cache the message
      this.messages = msg;
      console.log(this.messages);
      socket.emit('enterRoom', msg, async function(ack) {
        msg.socketId = ack.socketId;
      });
    },

    async check() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: this.checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.checkedOut ? 'enterRoom' : 'leaveRoom';
      socket.emit(event, msg, async function(ack) {
        msg.socketId = ack.socketId;
      });

      this.checkedOut = !this.checkedOut;
    },

    alertRooms() {
      console.log(this.messages);
      let visits = this.messages
        .map((v) => {
          if (v.message.toLowerCase() == 'entered') {
            return [v.room, v.sentTime];
          }
        })
        .filter((v) => v);
      console.log('entered', visits);
      socket.emit(
        'alertRooms',
        {
          visitor: this.yourId,
          room: '',
          message: visits,
          sentTime: new Date().toISOString(),
        },
        function(msg) {
          alert('Server acknowledges your Room Alerts:', msg);
        }
      );
    },

    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },

    socketServerIsOffline() {
      if (!socket.connected) {
        alert('Socket server is offline');
        return false;
      }
      return true;
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },

    handleMessage(msg) {
      this.messages = msg;
      if (msg.message == 'Alert') {
        let alertMsg = `A fellow visitor to ${msg.room} is in quarantine at ${msg.sentTime}`;
        alert(`handleMessage:`, alertMsg);
      }
    },

    removeVisitor() {
      // the server will remove this socket
      socket.emit('removeVisitor');
    },

    async deleteMessage(id) {
      Message.delete(id);
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

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },
  },

  watch: {
    roomId() {
      if (!this.checkedOut) {
        if (confirm('Should i check you out of', this.roomId, '?')) {
          socket.emit('leaveRoom', this.yourId, function(msg) {
            alert('Checked out of:', msg);
          });
        }
      }
    },
  },
  async created() {},

  async mounted() {
    socket.on('enterRoom', (roomId) => {
      console.log('Entered Room', roomId);
    });
    socket.on('leaveRoom', (msg) => this.handleMessage(msg));
    socket.on('connect', async () => {
      this.socketServerOnline = true;
    });
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
