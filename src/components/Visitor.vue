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
          <v-col cols="6">
            <v-text-field label="Your ID" v-model="yourId"></v-text-field
          ></v-col>

          <v-col cols="4">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Room ID"
            ></v-select>
          </v-col>
          <v-col cols="2">
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="check"
            >
              <v-icon>mdi-account-check</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-list dense>
          <v-subheader>Visits</v-subheader>
          <v-data-table
            :headers="messageHeaders"
            :items="messages"
            item-key="id"
            dense
            class="elevation-1"
          >
            <template v-slot:item.sentTime="{ item }">
              {{ visitedDate(item.sentTime) }}
            </template>
          </v-data-table>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <!-- <v-btn @click="checkin">Room Checkin</v-btn> -->
        <!-- <v-btn @click="checkout">Room Checkout</v-btn> -->
        <!-- <v-btn @click="alertRooms">Alert Rooms</v-btn> -->
        <span class="pr-3">Alert Rooms </span>
        <v-btn color="error" fab dark>
          <v-icon>mdi-alert</v-icon>
        </v-btn>
        <!-- <v-btn @click="removeVisitor">Leave LCT</v-btn> -->
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3003/';

import io from 'socket.io-client';
const socket = io('http://localhost:3000');
socket.on('alert', (msg) => {
  alert('alert', msg);
});

export default {
  name: 'LctVisitor',
  computed: {
    visits() {
      return this.messages.length;
    },
  },

  data: () => ({
    visitFormat: 'HH:mm, ddd, MMM DD',
    checkedOut: true,
    socketId: '',
    rooms: [],
    messages: [],
    yourId: 'Tao',
    roomId: 'Home',
    messageHeaders: [
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Purpose', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'SocketId', value: 'socketId' },
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
      socket.emit('newMessage', {
        visitor: this.yourId,
        room: this.roomId,
        message: 'alert',
        sentTime: new Date().toISOString(),
      });
    },
  },

  watch: {
    roomId() {
      socket.emit('leaveRoom', this.yourId, function(msg) {
        alert('RoomId chagned:', msg);
      });
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
