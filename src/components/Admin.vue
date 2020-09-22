<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row justify="space-between">
        <v-col>IO:{{ $socket.io.uri }}</v-col>
        <v-col>Build: {{ $build }} </v-col>
        <v-col>Socket: {{ $socket.id }} </v-col>
      </v-row> </v-system-bar
    ><v-card>
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
      <v-card-title>Room Admin</v-card-title>
      <v-card-subtitle>Monitor Socket.io Server</v-card-subtitle>
      <v-card-text>
        <v-row>
          <v-col>
            <v-btn @click="getAvailableRooms()">Refresh Available Rooms</v-btn>
          </v-col>
          <v-col>
            <v-data-table
              :headers="availableRoomsHeaders"
              :items="availableRooms"
              multi-sort
              item-key="name"
              dense
              :items-per-page="10"
              class="elevation-1"
            >
            </v-data-table>
          </v-col>
        </v-row>
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
            <v-btn @click="getVisitorRooms()">Refresh Visitor's Rooms</v-btn>
          </v-col>
          <v-col>
            <v-data-table
              :headers="visitorHeaders"
              :items="visitorsRooms"
              multi-sort
              item-key="name"
              dense
              :items-per-page="10"
              class="elevation-1"
            >
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

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
        { text: 'Room', value: 'name' },
        { text: 'Socket ID', value: 'id' },
      ],
      pendingRoomsHeaders: [{ text: 'Room', value: 'name' }],
      visitorHeaders: [
        { text: 'Visitor', value: 'name' },
        { text: 'Socket ID', value: 'id' },
      ],
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
    availableRoomsExposed(list) {
      // let list = rooms.length ? rooms : ['No Rooms are online right now.'];
      this.availableRooms = list;
      this.log(`Available Rooms: ${list}`);
    },

    pendingRoomWarningsExposed(list) {
      // let list = rooms.length ? rooms : ['No Rooms are online right now.'];
      this.pendingRooms = list.map((v) => {
        let x = {};
        x['name'] = v;
        return x;
      });
      this.log(`Pending Rooms: ${list}`);
    },

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

    visitorsRoomsExposed(list) {
      // let list = rooms.length ? rooms : ['No Visitors yet today.'];
      this.visitorsRooms = list;
      this.log(`Visitors Rooms: ${list}`);
    },
  },

  methods: {
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
    log(msg) {
      this.cons.push({
        sentTime: moment(),
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
