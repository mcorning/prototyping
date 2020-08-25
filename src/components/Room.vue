<template>
  <v-container>
    <v-card>
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
              @click="act"
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
      <v-card-actions>
        <span class="pr-3">Alert Room's Visitors </span>
        <v-btn color="error" fab dark>
          <v-icon x-large>mdi-alert</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-system-bar color="secondary">
      <v-icon small>mdi-transit-connection-variant </v-icon>
      <span>Server:{{ socketUrl }}</span>
      <v-spacer></v-spacer>
      <span>Socket: {{ socketInfo }}{{ socketId }}</span>
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
let socket;
connect();

function connect() {
  socket = io(config.socketUrl);
}

// socket.on('message', (msg) => alert(msg));

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
    socketInfo() {
      return socket.id;
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
    occupancy: 1, // assuming a person opens the Room
    socketUrl: config.socketUrl,
    socketId: '',
    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',
    closed: true,

    listUniqueVisitors: false,
    visitFormat: 'at HH:mm on ddd, MMM DD',
    messageHeaders: [
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
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
    yourId: '',
  }),
  methods: {
    emit(payload) {
      if (!socket.connected) {
        if (!confirm('Your socket is disconnected. Reconnect now? ')) {
          return;
        }
        connect();
      }
      console.log('payload :>> ', payload);
      socket.emit(payload.event, payload.message, payload.ack);
    },

    act() {
      let msg = {
        room: this.roomId,
        message: this.closed ? 'Opened' : 'Closed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.closed ? 'openRoom' : 'closeRoom';
      this.emit({ event: event, message: msg, ack: (msg) => alert(msg) });
      this.closed = !this.closed;
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
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
      console.log('deleting', id);
      if (this.daysBack == 0) {
        socket.disconnect();
        Message.delete(id);
        alert(
          socket.connected
            ? 'Socket still connected'
            : 'Your socket disconnected. Refesh to reconnect and to continue to receive messages.'
        );
      } else {
        this.emit({ event: 'disconnectAll' });
        alert('All sockets disconnected. Refesh to reconnect this socket.');
        Message.deleteAll();
      }
    },

    onCheckOut(msg) {
      ++this.occupancy;

      this.cons.push(
        'Room sees socket.id :>> ',
        socket.id,
        socket.room,
        socket.visitor
      );
      this.cons.push(new Date(), msg);
      this.messages.push(msg);
    },

    onCheckin(msg) {
      --this.occupancy;
      this.cons.push(
        'Room sees socket.id :>> ',
        socket.id,
        socket.room,
        socket.visitor
      );
      this.cons.push(new Date(), msg);
      this.messages.push(msg);
    },

    // Server forwarded from Visitor a Room occupied on given dates
    // Visitor sends this alert for each occupied Room
    // This function replies to server for each visitor that occpied the Room on those dates
    // visits: {visitor, [dates]}
    onNotifyRoom(message) {
      let visits = message.message;

      // map over the dates
      visits.map((visit) => {
        // from all cached messages, get Visitor(s) on each exposure date
        let visitors = this.messages.map((message) => {
          if (
            message.sentTime == visit.sentTime &&
            message.message.toLowerCase() == 'entered'
          )
            return message.visitor;
        });
        // now map over visitors for this date, and emit alertVisitor for each exposed visit
        visitors.map((visitor) => {
          this.emit({
            event: 'alertVisitor',
            message: {
              visitor: visitor,
              message: `You may have been exposed to Covid on ${visit}`,
              sentTime: new Date().toISOString(),
            },
            function(ack) {
              this.cons.push(ack);
            },
          });
        });
      });
    },
  },

  async created() {},

  async mounted() {
    // so we can reference this, as necessary
    let self = this;
    // check-X to disambiguate the server event handler, enterRoom/leaveRoom
    socket.on('check-in', (msg) => this.onCheckOut(msg)); // decrements occupancy
    socket.on('check-out', (msg) => this.onCheckin(msg)); // increments occupancy
    socket.on('notifyRoom', (msg) => this.onNotifyRoom(msg));
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();

    socket.on('connect', function() {
      self.socketId = socket.id;
    });
  },
};
</script>
