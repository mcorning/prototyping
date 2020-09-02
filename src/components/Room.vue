<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row>
        <v-col v-if="hasRoomManager">
          <!-- <span class="small">Room Manager: {{ managedRoom }}</span>
      <v-spacer></v-spacer>
      <v-checkbox v-model="hasRoomManager" label="RM" small>
        {{ hasRoomManager }}</v-checkbox
      > -->
        </v-col>
        <v-col>IO:{{ socketUrl }}</v-col>
        <v-col class="text-right">{{ ver }} </v-col>
      </v-row>
    </v-system-bar>
    <v-card>
      <v-card-title>Room Control</v-card-title>
      <v-card-subtitle
        >Monitor Visitors and alert them as necessary</v-card-subtitle
      >
      <v-card-text class="pb-0">
        <v-row dense>
          <v-col cols="3" class="col-md-3">
            <v-combobox
              v-model="roomId"
              @change="changeRoom"
              :items="rooms"
              label="My Room"
            ></v-combobox>
          </v-col>
          <v-col cols="4" class="col-md-4 pl-10">
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
          <!-- <v-col cols="5" class="col-md-5">
            <v-card>
              <v-card-text>
                Rooms are easy to get ready.
                <ol>
                  <li>Choose a room</li>
                  <li>Click the Open Room button.</li>
                </ol>
                Then watch as people checkin...
                <p class="pb-0">Visitor exposure alerts are automatic.</p>
              </v-card-text>
            </v-card>
          </v-col> -->

          <v-alert
            :value="alert"
            dismissible
            border="left"
            :color="alertColor"
            elevation="2"
            colored-border
            icon="mdi-alert"
            transition="scale-transition"
            ><span color="gray">{{ alertMessage }}</span>
          </v-alert>
          <Dialog v-if="dialog" @reconnect="connectToServer()" />
          <v-col cols="6" v-if="hasRoomManager">
            <v-text-field
              label="Room Manager ID"
              v-model="managedRoom"
            ></v-text-field
          ></v-col>
        </v-row>
      </v-card-text>
      <v-row dense>
        <v-col cols="12">
          <v-card-text class="pb-0">
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
                    :value="allVisits"
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
        
        <span class="pr-3">Alert Room's Visitors </span>
        <v-btn color="error" fab dark>
          <v-icon x-large>mdi-alert</v-icon>
        </v-btn>
      </v-card-actions> -->
    </v-card>
    <v-system-bar color="secondary">
      <!-- <v-icon small>mdi-transit-connection-variant </v-icon> -->

      <span class="small">Socket: {{ this.$socket.id }}</span>
      <v-spacer></v-spacer>
      <v-btn @click="testSocket" text><v-icon>mdi-test-tube</v-icon></v-btn>
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
import Dialog from '@/components/Dialog';

export default {
  name: 'LctRoom',
  components: { Dialog },
  computed: {
    roomisEmpty() {
      return Room.exists();
    },

    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        this.log(`State gets${newVal}, but we don't use it...odd.`);
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
      return this.allVisits;
    },

    entered() {
      return null;
      // this.visits
      //   ? this.visits.filter((v) => v.message == 'Entered').length
      //   : 0;
    },

    departed() {
      return null;
      // this.visits
      //   ? this.visits.filter((v) => v.message == 'Departed').length
      //   : 0;
    },

    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },
  },

  data: () => ({
    dialog: false,
    alert: false,
    alertColor: 'error',
    alertMessage: '',
    ver: config.ver,
    isConnected: false,
    cons: [],
    socketId: '',
    occupancy: 1, // assuming a person opens the Room
    socketUrl: config.socketUrl,
    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',
    closed: true,

    listUniqueVisitors: false,
    visitFormat: 'HH:mm on ddd, MMM DD',
    messageHeaders: [
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Room', value: 'room' },
      { text: 'SocketId', value: 'socketId' },
      { text: 'Delete', value: 'action' },
    ],
    logHeaders: [
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
    ],
    alertHeaders: [
      { text: 'Date of Alert', value: 'sentTime' },
      { text: 'Visitor', value: 'visitor' },
    ],
    alerts: [],
    yourId: '',
  }),

  sockets: {
    // socket.io reserved events
    connect() {
      this.socketId = this.$socket.id;
      // this.log(`Server connected on socket ${this.socketId}`);
    },

    disconnect() {
      this.log(
        'The server disconnected your socket (probably because you refreshed the browser).'
      );
    },
    // end socket.io reserved events

    // Visitor routine events
    checkIn(msg) {
      ++this.occupancy;
      // this.log(`Room count is now ${this.occupancy}`);
      this.messages = msg;
    },

    checkOut(msg) {
      --this.occupancy;
      // this.log(`Room count is now ${this.occupancy}`);
      this.messages = msg;
    },
    //

    // Room event handler

    // Server forwarded from Visitor a Room occupied on given dates
    // Visitor sends this alert for each occupied Room
    // This function replies to server for each visitor that occpied the Room on those dates
    notifyRoom(visit, ack) {
      this.alertMessage =
        'Visitor warning triggered Exposure Alert to all other visitors';
      this.alertColor = 'warning';
      this.alert = true;
      // map over the dates
      // from all cached messages, get Visitor(s) on each exposure date
      let visitors = this.messages.map((message) => {
        if (
          message.message.toLowerCase() == 'entered' &&
          moment(message.sentTime).format('YYYYMMDD') ==
            moment(visit.sentTime).format('YYYYMMDD')
        )
          return message.visitor;
      });
      // now map over visitors for this date, and emit alertVisitor for each exposed visit
      visitors.map((visitor) => {
        if (!visitor) {
          return;
        }
        let msg = `${visitor}, you may have been exposed to Covid on ${moment(
          visit.sentTime
        ).format('MMM DD')}`;
        this.emit({
          event: 'alertVisitor',
          message: {
            visitor: visitor,
            message: msg,
            sentTime: new Date().toISOString(),
          },
          ack: (ack) => {
            this.log(ack);
          },
        });
      });
      if (ack) ack('alert sent');
    },
  },

  methods: {
    // main methods
    changeRoom() {
      let msg;
      if (this.rooms.length > 1) {
        msg = {
          room: this.roomId,
          message: 'Closed',
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'closeRoom',
          message: msg,
          ack: (ack) => {
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = 'success';
            this.alert = true;
            this.log('Closed Room');
          },
        });
      }

      msg = {
        room: this.roomId,
        message: 'Opened',
        sentTime: new Date().toISOString(),
      };
      this.emit({
        event: 'openRoom',
        message: msg,
        ack: (ack) => {
          this.closed = ack.error.length;
          let msg = `${ack.message}  ${ack.error}`;
          this.alertMessage = msg;
          this.alertColor = 'success';
          this.alert = true;
          this.log('Opened Room');
        },
      });
    },

    connectToServer() {
      this.log('Connecting to Server...');
      this.$socket.connect();
    },

    emit(payload) {
      if (!this.$socket.id) {
        this.dialog = true;
        return;
      }
      this.log(`Emitting ${payload.event} to ${payload.message.visitor}`);
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    act() {
      let msg = {
        room: this.roomId,
        message: this.closed ? 'Opened' : 'Closed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.closed ? 'openRoom' : 'closeRoom';
      this.emit({
        event: event,
        message: msg,
        ack: (ack) => {
          this.alertColor = 'success';
          this.alertMessage = ack.message;
          this.alert = true;
        },
      });
      this.closed = !this.closed;
    },

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },
    // end main methods

    // helper methods
    log(msg) {
      this.cons.push({
        sentTime: moment(),
        message: msg,
      });
    },

    testSocket(event) {
      // this.$socket.emit(event, 'data');
      this.pingServer(event);
    },

    pingServer() {
      this.log(`Using socket ${this.$socket.id}...`);
      this.$socket.emit(
        'pingServer',
        this.roomId,
        (ack) => '...' + this.log(ack)
      );
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
    // end helper methods
  },

  async created() {},

  async mounted() {
    let self = this;
    if (!self.$socket.id) {
      self.connectToServer();
    } else {
      // we may need to refesh this vue's property if we come from the other vue
      self.socketId = self.$socket.id;
      self.log(`Mounted with socket ${self.socketId}`);
    }
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
