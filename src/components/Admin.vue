<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row justify="space-between">
        <v-col>IO:{{ $socket.io.uri }}</v-col>
        <v-col>Build: {{ $build }} </v-col>
        <v-col>Socket: {{ $socket.id }} </v-col>
      </v-row>
    </v-system-bar>

    <v-card>
      <v-card-title>Room Admin</v-card-title>
      <v-card-subtitle>Monitor Socket.io Server</v-card-subtitle>
      <v-card-text>
        <v-row>
          <v-col>
            <v-row>
              <v-col>
                <v-btn block @click="getAvailableRooms()"
                  >Refresh Available Rooms</v-btn
                ></v-col
              ></v-row
            >
            <v-row>
              <v-col>
                <v-btn block @click="getVisitorRooms()"
                  >Refresh Visitor's Rooms</v-btn
                ></v-col
              ></v-row
            >
          </v-col>
          <v-col>
            <v-data-table
              :headers="availableRoomsHeaders"
              :items="listedRooms"
              multi-sort
              item-key="name"
              dense
              group-by="type"
              :items-per-page="10"
              class="elevation-1"
            >
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-row>
          <v-col>
            <v-btn @click="getOccupiedRooms()">Refresh Occupied Rooms</v-btn>
          </v-col>
          <v-col>
            <v-data-table
              :headers="occupiedRoomsHeaders"
              :items="occupiedRooms"
              multi-sort
              item-key="room"
              dense
              :items-per-page="5"
              class="elevation-1"
            >
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-row>
          <v-col>
            <v-btn @click="getPendingRooms()">Refresh Pending Rooms</v-btn>
          </v-col>
          <v-col>
            <v-data-table
              item-key="name"
              :headers="pendingRoomsHeaders"
              :items="pendingRooms"
              multi-sort
              dense
              :items-per-page="10"
              class="elevation-1"
            >
            </v-data-table>
          </v-col> </v-row
      ></v-card-text>
    </v-card>
    <v-card>
      <v-card-title>World Clock</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field
              :value="sistersTime"
              label="Sisters"
              readonly
            ></v-text-field>
            <clock
              ref="sistersClock"
              :time="sistersClock"
              :bg="getClockBg(sistersTime)"
              :color="getClockColor(sistersTime)"
            ></clock>
          </v-col>
          <v-col>
            <v-text-field
              :value="zuluTime"
              readonly
              label="Zulu "
            ></v-text-field>
            <!-- <clock :time="zuluClock"></clock> -->
            <clock
              :time="zuluClock"
              :bg="getClockBg(zuluTime)"
              :color="getClockColor(zuluTime)"
            ></clock>
          </v-col>
          <v-col>
            <v-text-field
              :value="singaporeTime"
              label="Singapore "
              readonly
            ></v-text-field>
            <clock
              :time="singaporeClock"
              :bg="getClockBg(singaporeTime)"
              :color="getClockColor(singaporeTime)"
            ></clock>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Namespace Admin</v-card-title>
      <v-card-subtitle
        >Network Admins, manage the structural organization of your Local
        Contact Tracing network</v-card-subtitle
      >
      <v-card-text>
        <v-text-field
          v-model="namespace"
          label="Enter your organization structure name"
        ></v-text-field>
        <!-- <v-list flat dense> -->
        <!-- <v-list-item-group v-model="namespace" color="primary">
            <v-list-item v-for="(item, i) in namespaces" :key="i">
              <v-list-item-content>
                <v-list-item-title v-text="item"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list> -->
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Audit Trail</v-card-title>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        :search="search"
        :headers="logHeaders"
        :items="cons"
        group-by="type"
        multi-sort
        item-key="id"
        dense
        :items-per-page="15"
        class="elevation-1"
      >
        <template v-slot:item.message="{ item }">
          <v-textarea
            :value="item.message"
            background-color="grey lighten-3"
          ></v-textarea>
        </template>

        <template v-slot:item.sentTime="{ item }">
          <v-card flat min-width="200" class="text-right">
            {{ visitedDate(item.sentTime) }}</v-card
          >
        </template>
      </v-data-table>
      <div class="text-center">
        How are we doing on the Admin experience?

        <v-rating
          v-model="rating"
          background-color="primary lighten-3"
          color="primary"
          large
        ></v-rating>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import moment from 'moment';
import mtz from 'moment-timezone';
import Clock from 'vue-clock2';

import State from '@/models/State';

window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + message);
};

export default {
  name: 'LctRoomAdmin',
  components: { Clock },

  computed: {
    namespace: {
      get() {
        // this design has only one State entity record
        // when we support multiple organizations/namespaces we may use multiple State records
        return State.query().first()?.namespace;
      },
      set(newVal) {
        // static changeNamespace function on State model
        State.changeNamespace(newVal);
      },
    },
  },
  data() {
    return {
      visitFormat: 'HH:mm on ddd, MMM DD',

      search: '',
      sistersClock: this.getSistersTime(),
      sistersTime: mtz
        .utc()
        .tz('America/Los_Angeles')
        .format('llll'),

      zuluClock: this.getZuluTime(),
      zuluTime: mtz
        .utc()
        .tz('Europe/London')
        .format('llll'),

      singaporeClock: null,
      singaporeTime: mtz
        .utc()
        .tz('Asia/Singapore')
        .format('llll'),

      // namespaces: ['/'],
      availableRooms: [],
      listedRooms: [],
      pendingRooms: [],
      occupiedRooms: [],
      visitorsRooms: [],
      rating: 0,
      occupiedRoomsHeaders: [
        { text: 'Room', value: 'room' },
        { text: 'Occupancy  ', value: 'occupancy' },
        { text: 'Visitors  ', value: 'visitors' },
      ],
      availableRoomsHeaders: [
        { text: 'Type', value: 'type' },
        { text: 'Room/Visitor', value: 'name' },
        { text: 'Socket ID', value: 'id' },
      ],
      pendingRoomsHeaders: [{ text: 'Room', value: 'name' }],

      logHeaders: [
        { text: 'Message', value: 'message' },
        { text: 'Sent  ', value: 'sentTime' },
      ],
      cons: [],
    };
  },
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
    // end socket.io reserved events

    //App event handlers
    // list looks like this: '[{"name":"Heathlands.Medical","id":"P9AdUxzLaJqE3i1PAAAA"}]'
    availableRoomsExposed(list) {
      // let list = rooms.length ? rooms : ['No Rooms are online right now.'];
      this.availableRooms = list.map((v) => {
        v['type'] = 'available';
        return v;
      });
      this.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
    },
    // list looks like this: '[{"name":"AirGas","id":"UDCFuaoF-qJt4360AAAR"}]'
    visitorsRoomsExposed(list) {
      // let list = rooms.length ? rooms : ['No Visitors yet today.'];
      this.visitorsRooms = list.map((v) => {
        v['type'] = 'visitor';
        return v;
      });
      this.listedRooms = [...this.availableRooms, ...this.visitorsRooms];
      this.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
    },
    pendingRoomsExposed(list = ['No Rooms are online right now.']) {
      this.pendingRooms = list.map((v) => {
        let x = {};
        x['name'] = v;
        x['type'] = 'pending';
        return x;
      });

      this.log(`Pending Rooms: ${list}`);
    },

    // rooms looks like this: '[["ABMS.Medical",{"sockets":{"9hc2HMTpeMGUQgg2AAAS":true,"UDCFuaoF-qJt4360AAAR":true},"length":2}]]'
    occupiedRoomsExposed(rooms) {
      if (!rooms) {
        this.log('No occupied Rooms');
        return;
      }
      let list = rooms.map((c) => {
        let x = {
          room: c[0],
          occupancy: c[1].length,
          visitors: Object.keys(c[1].sockets)
            .toString()
            .split(',')
            .join(', '),
        };
        return x;
      });

      this.occupiedRooms = list;
      this.log(`Handled Occupied Rooms`);
    },
  },

  methods: {
    getTextColor(type) {
      return type == 'alert'
        ? 'red--text'
        : type == 'debug'
        ? 'orange--text'
        : '';
    },
    refresh() {
      this.$socket.emit('exposeAvailableRooms');
      this.$socket.emit('exposePendingRooms');
      this.$socket.emit('exposeOccupiedRooms');
      this.$socket.emit('exposeVisitorsRooms');
    },

    connectToServer() {
      this.log('Connecting to Server...');
      this.$socket.connect();
    },

    getClockBg(thisClock) {
      return thisClock.includes('PM') ? 'lightGray' : 'white';
    },
    getClockColor(thisClock) {
      return thisClock.includes('PM') ? 'black' : 'gray';
    },
    getAvailableRooms() {
      this.$socket.emit('exposeAvailableRooms');
    },
    getPendingRooms() {
      this.$socket.emit('exposePendingRooms');
    },
    getOccupiedRooms() {
      this.$socket.emit('exposeOccupiedRooms');
    },
    getVisitorRooms() {
      this.$socket.emit('exposeVisitorsRooms');
    },

    // helper methods
    log(msg, type = 'information') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },

    getSistersTime() {
      let t = mtz
        .utc()
        .tz('America/Los_Angeles')
        .format('hh:mm');
      this.sistersClock = t;
      return t;
    },
    getZuluTime() {
      let t = mtz
        .utc()
        .tz('Europe/London')
        .format('hh:mm');
      this.zuluClock = t;
      return t;
    },
    getSingaporeTime() {
      let t = mtz
        .utc()
        .tz('Asia/Singapore')
        .format('hh:mm');
      this.singaporeClock = t;
      return t;
    },
  },

  async created() {
    await State.$fetch();
  },

  async mounted() {
    let self = this;
    if (!self.$socket.id) {
      self.connectToServer();
    } else {
      // we may need to refesh this vue's property if we come from the other vue
      self.socketId = self.$socket.id;
      self.log(`Mounted with socket ${self.socketId}`);
    }

    this.refresh();
    // let nsp = State.query().first()?.namespace;
    // console.log('namespace', nsp);
    // this.$socket.emit('welcomeAdmin', nsp, (ack) => this.log(ack));

    self.zuluClock = self.getZuluTime();
    setInterval(self.getZuluTime, 60000);

    self.sistersClock = self.getSistersTime();
    setInterval(self.getSistersTime, 60000);

    self.singaporeClock = self.getSingaporeTime();
    setInterval(self.getSingaporeTime, 60000);

    console.log('Admin.vue mounted');
  },
};
</script>
