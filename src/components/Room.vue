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
            <v-combobox
              v-model="roomId"
              :items="rooms"
              label="My Room"
            ></v-combobox>
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
              v-model="managedRoom"
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
        <span class="pr-3">Alert Room's Visitors </span>
        <v-btn color="error" fab dark>
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
      <span>Room Manager: {{ managedRoom }}</span>

      <v-spacer></v-spacer>
      <v-checkbox v-model="hasRoomManager" label="RM" small>
        {{ hasRoomManager }}</v-checkbox
      >
    </v-system-bar>
  </v-container>
</template>

<script>
import config from '@/config.json';

import moment from 'moment';

import io from 'socket.io-client';
const socket = io(config.socketUrl);
socket.on('exposureAlert', (msg) => {
  alert('Exposure Alert', msg);
});

import Message from '@/models/Message';
import Name from '@/models/Name';
import Room from '@/models/Room';
import State from '@/models/State';

export default {
  name: 'LctRoom',
  components: {},
  computed: {
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

    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },
  },

  data: () => ({
    socketUrl: config.socketUrl,

    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',
    closed: true,

    listUniqueVisitors: false,
    visitFormat: 'HH:mm, ddd, MMM DD  YYYY ',
    messageHeaders: [
      // { text: 'Id', value: 'id' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Room', value: 'room' },
      // { text: 'SocketId', value: 'socketId' },
      { text: 'Delete', value: 'action' },
    ],
    alertHeaders: [
      { text: 'Date of Alert', value: 'sentTime' },
      { text: 'Visitor', value: 'visitor' },
    ],
    alerts: [],
    yourId: '',
  }),
  methods: {
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

    deleteMessage(id) {
      Message.delete(id);
    },
  },

  async created() {},

  async mounted() {
    this.check();
    // check-X to disambiguate the server event handler, enter/leaveRoom
    socket.on('check-in', (msg) => this.handleMessage(msg));
    socket.on('check-out', (msg) => this.handleMessage(msg));
    socket.on('exposureAlert', (msg) => this.handleMessage(msg));
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
