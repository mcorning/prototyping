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

          <v-col cols="6">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Room ID"
            ></v-select> </v-col
        ></v-row>
        {{ socketId }}
      </v-card-text>
      <v-card-text>
        <v-list dense>
          <v-subheader>Visits</v-subheader>
          <v-list-item-group v-model="visits" color="primary">
            <v-list-item v-for="(name, i) in messages" :key="i">
              <v-list-item-icon>
                <v-icon>mdi-account-check</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title
                  v-text="`${name.room}:  ${visitedDate(name.sentTime)}`"
                ></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="checkin">Room Checkin</v-btn>
        <v-btn @click="checkout">Room Checkout</v-btn>
        <v-btn @click="alertRooms">Alert Rooms</v-btn>
        <v-btn @click="removeVisitor">Leave LCT</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';

import io from 'socket.io-client';
const socket = io('http://localhost:3000');
socket.on('alert', (msg) => {
  alert('alert', msg);
});
socket.on('entered', () => {
  console.log('entered Room');
});

export default {
  name: 'LctVisitor',
  computed: {
    visits() {
      return this.messages.length;
    },
  },

  data: () => ({
    visitFormat: 'ddd, MMM DD, HH:mm',

    socketId: '',
    rooms: [],
    messages: [],
    yourId: 'Tao',
    roomId: 'Home',
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
    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      // let x = moment(date).format(this.visitFormat);
      return x;
    },
    handleMessage(msg) {
      this.messages.push(msg);
      if (msg.message == 'Alert') {
        let alertMsg = `A fellow visitor to ${msg.room} is in quarantine at ${msg.sentTime}`;
        alert(`handleMessage:`, alertMsg);
      }
    },
    checkin() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Check-in',
        sentTime: new Date().toISOString(),
      };
      this.messages.push(msg);

      this.visit(msg);
    },

    checkout() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Check-out',
        sentTime: new Date().toISOString(),
      };
      this.messages.push(msg);

      this.leave(msg);
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

    visit(msg) {
      socket.emit(
        'visit',
        {
          roomId: this.roomId,
          yourId: this.yourId,
          message: msg,
          sentTime: new Date().toISOString(),
        },
        function(msg) {
          alert('Visit returned:\n' + msg.msg + '\nSocketId:' + msg.socketId);
          console.log('returned socketId:', msg.socketId);
        }
      );
    },

    leave(msg) {
      socket.emit(
        'leave',
        {
          roomId: this.roomId,
          yourId: this.yourId,
          message: msg,
          sentTime: new Date().toISOString(),
        },
        function(msg) {
          alert('Visit:\n' + msg.msg);
          this.socketId = msg.socketId;
        }
      );
    },
  },

  watch: {
    roomId() {
      socket.emit('leave', this.yourId, function(msg) {
        alert('RoomId chagned:', msg);
      });
      this.visit('Changed rooms');
    },
  },

  mounted() {
    this.yourId = config.yourId;
    this.roomId = config.roomId;
    this.rooms = config.rooms;
    socket.on('newNessage', (msg) => this.handleMessage(msg));
    socket.on('addedRoom', (msg) => {
      this.rooms.push(msg.roomId);
      alert('Rooms available:', msg.numRooms);
    });
  },
};
</script>
