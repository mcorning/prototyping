<template>
  <v-container>
    <v-card dark>
      <v-card-title>Room Control</v-card-title>
      <v-card-subtitle
        >Monitor Visitors and alert them as necessary</v-card-subtitle
      >
      <v-card-text>
        <v-row dense>
          <v-col cols="6" class="col-md-4">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Room ID"
            ></v-select>
          </v-col>
          <v-col cols="6" class="col-md-8">
            <v-btn
              :color="closed ? 'success' : 'warning'"
              fab
              dark
              @click="check"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn>
            <span class="pl-3">{{ closed ? 'Open Room' : 'Close Room' }}</span>
          </v-col>
          <v-col cols="6" v-if="hasRoomManager">
            <v-text-field
              label="Room Manager ID"
              v-model="managerId"
            ></v-text-field
          ></v-col>
        </v-row>
      </v-card-text>
      <v-row>
        <v-col cols="12">
          <v-card-text>
            <v-subheader>
              <v-row align="center" justify="space-between">
                <v-col cols="auto">
                  <span
                    >Today's Visitor Log - {{ entered }} visits [{{
                      uniqueVisitorNames.length
                    }}
                    unique visitor(s)]</span
                  ></v-col
                >
                <v-col>
                  <v-checkbox
                    label="See all visits"
                    @change="toggleVisits"
                  ></v-checkbox
                ></v-col>
                <v-col cols="auto">
                  <v-icon
                    class="pr-9"
                    label="Refresh messages"
                    @click="getMessages()"
                    >mdi-email-sync-outline</v-icon
                  ></v-col
                >
              </v-row>
            </v-subheader>
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
      <!-- <v-card-actions>
        <v-btn @click="open">Open Room</v-btn>
        <v-btn @click="close">Close Room</v-btn>
      </v-card-actions> -->
      <v-card-actions>
        <span class="pr-3">Alert Visitors </span>
        <v-btn color="error" fab dark large>
          <v-icon x-large>mdi-alert</v-icon>
        </v-btn>
        <!-- <v-btn @click="alertVisitors">Alert Visitors</v-btn>
        <v-btn @click="leave">Leave LCT</v-btn> -->
      </v-card-actions>
    </v-card>
    <v-system-bar color="secondary">
      <v-icon small>mdi-transit-connection-variant </v-icon>
      <span>Socket URL:{{ socketUrl }}</span>

      <v-spacer></v-spacer>
      <span>Data URL:{{ dataUrl }}</span>

      <v-spacer></v-spacer>
      <v-checkbox v-model="hasRoomManager" label="RM" small>
        {{ hasRoomManager }}</v-checkbox
      >
    </v-system-bar>
  </v-container>
</template>

<script>
import config from '@/config.json';
import axios from 'axios';
axios.defaults.baseURL = config.dataUrl;

import moment from 'moment';

import io from 'socket.io-client';
const socket = io(config.socketUrl);
socket.on('exposureAlert', (msg) => {
  alert('Exposure Alert', msg);
});
export default {
  name: 'LctRoom',
  components: {},
  computed: {
    entered() {
      return this.visits.filter((v) => v.message == 'Entered').length;
    },
    departed() {
      return this.visits.filter((v) => v.message == 'Departed').length;
    },

    visits() {
      const allRoomVisits = this.messages.filter((v) => this.roomId == v.room);
      return allRoomVisits.filter((v) => this.isBetween(v.sentTime));
    },

    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },
  },

  data: () => ({
    dataUrl: config.dataUrl,
    socketUrl: config.socketUrl,

    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',
    closed: true,

    rooms: [],
    managerId: '',
    listUniqueVisitors: false,
    visitFormat: 'HH:mm, ddd, MMM DD  YYYY ',
    messageHeaders: [
      { text: 'Id', value: 'id' },

      { text: 'Visitor', value: 'visitor' },
      { text: 'Purpose', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Room', value: 'room' },
      { text: 'SocketId', value: 'socketId' },
      { text: 'Delete', value: 'action' },
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
    check() {
      let msg = {
        visitor: '',
        room: this.roomId,
        message: this.checkedOut ? 'Opened' : 'Closed',
        sentTime: new Date().toISOString(),
      };
      let data = {
        event: this.closed ? 'open' : 'close',
        message: msg,
      };
      this.postMessage(data);
      this.closed = !this.closed;
    },

    // called by check-in
    postMessage(data) {
      socket.emit(data.event, data.message, function(ack) {
        data.message.socketId = ack.socketId;
        // cache the message
        axios.post('rooms', data.message);
      });
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },
    handleMessage(msg) {
      console.log(new Date(), msg);
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

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },

    async getMessages() {
      try {
        const res = await axios.get(`messages`);
        console.log(res);
        this.messages = res.data;
      } catch (e) {
        console.error(e);
      }
    },

    deleteMessage(id) {
      let url = `${this.dataUrl}messages/${id}`;
      axios.delete(url).catch((e) => console.log(e.message));
    },
  },

  async created() {
    await this.getMessages();
  },

  async mounted() {
    this.yourId = config.yourId;
    this.roomId = config.roomId;
    this.managerId = config.managerId;
    this.rooms = config.rooms;
    this.check();
    // check-X to disambiguate the server event handler, enter/leaveRoom
    socket.on('check-in', (msg) => this.handleMessage(msg));
    socket.on('check-out', (msg) => this.handleMessage(msg));
    socket.on('exposureAlert', (msg) => this.handleMessage(msg));
  },
};
</script>
