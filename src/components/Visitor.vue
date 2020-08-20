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
            <v-text-field label="Your ID" v-model="yourId"></v-text-field
          ></v-col>

          <v-col cols="4">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Room ID"
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
          <v-col>
            <v-btn @click="test">Test</v-btn>
          </v-col>
        </v-row>
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
                label="See all visits"
                @change="toggleVisits"
              ></v-checkbox
            ></v-col>
            <v-col cols="2">
              <v-icon
                class="pr-9"
                label="Refresh messages"
                @click="getMessages()"
                >mdi-email-sync-outline</v-icon
              ></v-col
            >
          </v-row>
          <v-data-table
            :headers="messageHeaders"
            :items="visits"
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
      <v-card-actions>
        <!-- <v-btn @click="checkin">Room Checkin</v-btn> -->
        <!-- <v-btn @click="checkout">Room Checkout</v-btn> -->
        <!-- <v-btn @click="alertRooms">Alert Rooms</v-btn> -->
        <span class="pr-3">Alert Rooms </span>
        <v-btn color="error" fab dark @click="alertRooms">
          <v-icon>mdi-alert</v-icon>
        </v-btn>
        <!-- <v-btn @click="removeVisitor">Leave LCT</v-btn> -->
      </v-card-actions>
    </v-card>
    <v-system-bar color="secondary">
      <v-icon small>mdi-transit-connection-variant </v-icon>
      <span>Socket URL:{{ socketUrl }}</span>

      <v-spacer></v-spacer>
      <span>Data URL:{{ dataUrl }}</span>
      <v-spacer></v-spacer>
    </v-system-bar>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';
import axios from 'axios';
axios.defaults.baseURL = config.dataUrl;

import io from 'socket.io-client';
const socket = io(config.socketUrl);
socket.on('alert', (msg) => {
  alert('alert', msg);
});
socket.on('exposureAlert', (msg) => {
  alert('Exposure Alert\nExposure Dates:\n' + JSON.stringify(msg));
});

export default {
  name: 'LctVisitor',
  computed: {
    visits() {
      const allRoomVisits = this.messages.filter((v) => this.roomId == v.room);
      // return allRoomVisits;
      return allRoomVisits.filter((v) => this.isBetween(v.sentTime));
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

    dataUrl: config.dataUrl,
    socketUrl: config.socketUrl,
    visitFormat: 'HH:mm, ddd, MMM DD',
    checkedOut: true,
    socketId: '',
    rooms: [],
    messages: [],
    yourId: 'Tao',
    roomId: 'Home',
    messageHeaders: [
      { text: 'Id', value: 'id' },
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Purpose', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      // { text: 'SocketId', value: 'socketId' },
      { text: 'Delete', value: 'action' },
    ],
    importantLinks: [
      {
        text: 'Documentation',
        href: 'https://vuetifyjs.com',
      },
      {
        text: 'Chat',
        href: 'https://community.vuetifyjs.com',
      },
      {
        text: 'Made with Vuetify',
        href: 'https://madewithvuejs.com/vuetify',
      },
      {
        text: 'Twitter',
        href: 'https://twitter.com/vuetifyjs',
      },
      {
        text: 'Articles',
        href: 'https://medium.com/vuetify',
      },
    ],
    whatsNext: [
      {
        text: 'Explore components',
        href: 'https://vuetifyjs.com/components/api-explorer',
      },
      {
        text: 'Select a layout',
        href: 'https://vuetifyjs.com/getting-started/pre-made-layouts',
      },
      {
        text: 'Frequently Asked Questions',
        href:
          'https://vuetifyjs.com/getting-started/frequently-asked-questions',
      },
    ],
  }),

  methods: {
    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },
    async test() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Entered',
        sentTime: moment()
          .add(-this.getRandomInt(3), 'day')
          .toISOString(),
      };
      let data = {
        event: 'enterRoom',
        message: msg,
      };
      await this.postMessage(data);
    },

    async getMessages() {
      try {
        const res = await axios.get(`http://localhost:3003/messages`);

        this.messages = res.data;
      } catch (e) {
        console.error(e);
      }
    },

    async check() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: this.checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      let data = {
        event: this.checkedOut ? 'enterRoom' : 'leaveRoom',
        message: msg,
      };
      await this.postMessage(data);

      this.checkedOut = !this.checkedOut;
    },

    // called by check-in
    async postMessage(data) {
      socket.emit(data.event, data.message, async function(ack) {
        data.message.socketId = ack.socketId;
        // cache the message
        await axios.post('messages', data.message);
      });

      // display while axios works
      this.messages.push(data.message);
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },

    handleMessage(msg) {
      this.messages.push(msg);
      if (msg.message == 'Alert') {
        let alertMsg = `A fellow visitor to ${msg.room} is in quarantine at ${msg.sentTime}`;
        alert(`handleMessage:`, alertMsg);
      }
    },

    removeVisitor() {
      // the server will remove this socket
      socket.emit('removeVisitor');
    },

    alertRooms() {
      const exposureDates = this.messages.map((v) => v.sentTime);
      console.log(exposureDates);
      socket.emit(
        'alertRooms',
        {
          visitor: this.yourId,
          room: this.roomId,
          message: exposureDates,
          sentTime: new Date().toISOString(),
        },
        function(msg) {
          alert('Alerted Rooms:', msg);
        }
      );
    },
    deleteMessage(id) {
      let url = `${this.dataUrl}messages/${id}`;
      axios
        .delete(url)
        .then(
          this.getMessages().then(() =>
            console.log('messages after delete', this.messages)
          )
        )
        .catch((e) => console.log(e.message));
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
  async created() {
    await this.getMessages();
  },

  mounted() {
    this.yourId = config.yourId;
    this.roomId = config.roomId;
    this.rooms = config.rooms;
    socket.on('enterRoom', (roomId) => {
      console.log('Entered Room', roomId);
    });
    socket.on('leaveRoom', (msg) => this.handleMessage(msg));
    // socket.on('addRoom', (msg) => {
    //   this.rooms.push(msg.roomId);
    //   alert('Rooms available:', msg.numRooms);
    // });
  },
};
</script>
