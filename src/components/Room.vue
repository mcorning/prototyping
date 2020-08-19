<template>
  <v-container>
    <v-card dark>
      <v-card-title>Room Control</v-card-title>
      <v-card-subtitle
        >Monitor Visitors and alert them as necessary</v-card-subtitle
      >
      <v-card-text>
        <v-row dense>
          <v-col cols="6">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Room ID"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <v-text-field
              label="Room Manager ID"
              v-model="managerId"
            ></v-text-field
          ></v-col>
        </v-row>
      </v-card-text>
      <v-row>
        <v-col cols="6">
          <v-card-text>
            <v-subheader
              >Today's Visitor Log - count:{{ messages.length }} (unique visits:
              {{ uniqueVisitorNames.length }})</v-subheader
            >

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
          </v-card-text>
        </v-col>
        <v-col cols="6">
          <v-card-text v-if="listUniqueVisitors">
            <v-subheader>Unique Visitors Today</v-subheader>

            <v-list dense max-height="2" height="2">
              <v-list-item-group v-model="uniqueVisitorNames" color="primary">
                <v-list-item
                  v-for="(visitor, i) in uniqueVisitorNames"
                  :key="i"
                >
                  <v-list-item-content>
                    <v-list-item-title v-text="visitor"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-col>
      </v-row>

      <v-card-text v-if="alerts.length">
        <v-data-table
          :headers="alertHeaders"
          :items="alerts"
          item-key="id"
          dense
          class="elevation-1"
        >
          <template v-slot:item.sentTime="{ item }">
            {{ visitedDate(item.sentTime) }}
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="open">Open Room</v-btn>
        <v-btn @click="close">Close Room</v-btn>
      </v-card-actions>
      <v-card-actions>
        <v-btn @click="alertVisitors">Alert Visitors</v-btn>
        <v-btn @click="leave">Leave LCT</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import config from '@/config.json';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3003/';

import moment from 'moment';

import io from 'socket.io-client';
const socket = io('http://localhost:3000');

export default {
  name: 'LctRoom',
  components: {},
  computed: {
    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
  },

  data: () => ({
    rooms: [],
    managerId: '',
    listUniqueVisitors: false,
    visitFormat: 'ddd, MMM DD, HH:mm',
    messageHeaders: [
      { text: 'Visitor', value: 'visitor' },
      { text: 'SocketId', value: 'socketId' },
      { text: 'Sent  ', value: 'sentTime' },
    ],
    alertHeaders: [
      { text: 'Date of Alert', value: 'sentTime' },
      { text: 'Visitor', value: 'visitor' },
    ],
    alerts: [],
    messages: [],
    yourId: '',
    roomId: '',
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
    open() {
      socket.emit('open', this.roomId, (msg) => {
        alert(msg.msg);
        const message = {
          roomId: this.roomId,
          yourId: '',
          message: 'Opened',
          sentTime: new Date().toISOString(),
          socketId: '',
        };
        message.socketId = msg.socketId;
        axios.post('rooms', message);
      });
    },
    close() {
      socket.emit('close', this.roomId, (msg) => {
        alert(msg.msg);
        const message = {
          roomId: this.roomId,
          yourId: '',
          message: 'Closed',
          sentTime: new Date().toISOString(),
          socketId: '',
        };
        message.socketId = msg.socketId;
        axios.post('rooms', message);
      });
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },
    handleMessage(msg) {
      this.messages.push(msg);

      if (msg.message == 'alert') {
        this.alerts.push(msg);
        alert('New message:', msg);
        return;
      }
    },

    alertVisitors() {
      socket.emit('newMessage', {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Alert',
        sentTime: new Date().toISOString(),
      });
    },
    leave() {
      socket.emit('removeRoom');
    },
  },
  mounted() {
    this.yourId = config.yourId;
    this.roomId = config.roomId;
    this.managerId = config.managerId;
    this.rooms = config.rooms;
    this.open();
    // check-X to disambiguate the server event handler, enter/leaveRoom
    socket.on('check-in', (msg) => this.handleMessage(msg));
    socket.on('check-out', (msg) => this.handleMessage(msg));
  },
};
</script>
