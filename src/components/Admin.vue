<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row align="center" justify="space-between">
        <v-col>IO:{{ $socket.io.uri }}</v-col>
        <v-col class="text-center">UA: {{ userAgent }}</v-col>

        <v-col class="text-right">
          <v-btn text @click="refreshConnection(true)"
            ><v-icon>mdi-block-helper</v-icon>{{ $build }}</v-btn
          ></v-col
        >
      </v-row>
    </v-system-bar>

    <v-card>
      <v-card-title>Socket.io Server Monitor</v-card-title>
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
            <v-row>
              <v-col>
                <v-btn block @click="getAllRooms()">Get All Rooms</v-btn></v-col
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
        <v-card-subtitle>Pending Visitors</v-card-subtitle>
        <v-textarea
          auto-grow
          color="red"
          :value="JSON.stringify(pendingVisitors, null, '\t')"
        ></v-textarea>
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
    <v-system-bar color="secondary">
      <v-row align="center" justify="space-between">
        <v-col>Socket: {{ socketInfo() }}</v-col>
        <v-col class="text-center"
          ><v-btn @click="addTestMessage" text
            ><v-icon>mdi-test-tube</v-icon></v-btn
          >
        </v-col>
        <v-col class="text-right">
          <v-btn @click="disconnectFromServer" text>
            <v-icon>mdi-door-closed-lock</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-system-bar>
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
              :value="indiaTime"
              label="Jaipur"
              readonly
            ></v-text-field>
            <clock
              :time="indiaClock"
              :bg="getClockBg(indiaTime)"
              :color="getClockColor(indiaTime)"
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
    userAgent() {
      let ua = navigator.userAgent;
      let userAgent;
      if (ua.includes('Edg')) {
        userAgent = 'Edge';
      } else if (ua.includes('Chrome')) {
        userAgent = 'Chrome';
      } else if (ua.includes('Firefox/82')) {
        userAgent = 'Firefox Dev';
      } else if (ua.includes('Firefox') || ua.includes('KHTML')) {
        userAgent = 'Firefox';
      } else {
        userAgent = 'Unknown ';
      }
      return userAgent;
    },
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
      visitorSocket: {},
      visitor: {
        visitor: 'Me',
        id: 'UniquelyMe',
        nsp: 'enduringNet',
      },

      pendingVisitors: new Map(),
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

      indiaClock: null,
      indiaTime: mtz
        .utc()
        .tz('Asia/Kolkata')
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
        { text: 'Room/Visitor', value: 'visitor' },
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
      if (this.$socket.io.opts?.query) {
        const { room, id, nsp } = this.$socket.io.opts.query;
        this.log(
          `Server connected using Id:${id}, Room: ${room}, and nsp ${nsp} `
        );
        this.socketId = id;
      }
    },

    reconnect() {
      this.socketId = this.$socket.id;

      this.log(`Server re-connected on socket ${this.socketId}`);
    },

    // end socket.io reserved events

    //App event handlers
    pendingVisitorsExposed(list) {
      this.pendingVisitors = [...this.pendingVisitors, ...list];
    },

    // list looks like this: [{"name": "cMmtMjvRKxvSNRlUAAAA",		"id": "cMmtMjvRKxvSNRlUAAAA",		"type": ""	}],
    allRoomsExposed(list) {
      this.availableRooms = list.map((v) => {
        v['type'] = 'raw';
        return v;
      });
      this.listedRooms = [...this.availableRooms, ...this.visitorsRooms];
      this.log(`All Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
    },
    // list looks like this: '[{"name":"Heathlands.Medical","id":"P9AdUxzLaJqE3i1PAAAA"}]'
    availableRoomsExposed(list) {
      // let list = rooms.length ? rooms : ['No Rooms are online right now.'];
      this.availableRooms = list.map((v) => {
        v['type'] = 'available';
        return v;
      });
      this.listedRooms = [...this.availableRooms, ...this.visitorsRooms];

      this.log(`Available Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
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
    exposeEventPromise(clientSocket, event) {
      return new Promise(function(resolve) {
        clientSocket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },
    socketInfo() {
      if (this.$socket.disconnected) {
        return 'Connecting...';
      }

      const query = this.$socket.io.opts?.query;
      if (!query) {
        return `${this.$socket.id} isn't yours. Restart app.`;
      }

      const { id, nsp, admin } = query;
      const info = `${nsp} ${id} ${admin}`;
      return info;
    },

    addTestMessage() {
      // open up the message list beyond today
      this.daysBack = 14;
      // get a random number of days back for test data
      let days = this.getRandomIntBetween(2, 4);
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Entered',
        sentTime: moment()
          .add(-days, 'day')
          .toISOString(),
      };
      // cache the message in IndexedDB
      this.messages = msg;
      // log the test data
      this.log(JSON.stringify(msg));
      this.emit({
        event: 'enterRoom',
        message: msg,
      });
    },

    getTextColor(type) {
      return type == 'alert'
        ? 'red--text'
        : type == 'debug'
        ? 'orange--text'
        : '';
    },
    refresh() {
      this.$socket.emit('exposeAllRooms');
      this.$socket.emit('exposeAvailableRooms');
      this.$socket.emit('exposePendingRooms');
      this.$socket.emit('exposeOccupiedRooms');
      this.$socket.emit('exposeVisitorsRooms');
    },
    disconnectFromServer() {
      console.log('Disconnection from Server');
      this.$socket.disconnect(true); // passing true closes underlying connnection
    },

    getClockBg(thisClock) {
      return thisClock.includes('PM') ? 'lightGray' : 'white';
    },
    getClockColor(thisClock) {
      return thisClock.includes('PM') ? 'black' : 'gray';
    },
    getAllRooms() {
      this.$socket.emit('exposeAllRooms');
    },
    async getAvailableRooms() {
      let list = await this.exposeEventPromise(
        this.$socket,
        'exposeAvailableRooms'
      );
      this.availableRooms = list.map((v) => {
        v['type'] = 'available';
        return v;
      });
      this.listedRooms = [...this.availableRooms, ...this.visitorsRooms];

      this.log(`Available Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
    },
    getPendingRooms() {
      this.$socket.emit('exposePendingRooms');
    },
    getOccupiedRooms() {
      this.$socket.emit('exposeOccupiedRooms');
    },
    async getVisitorRooms() {
      let list = await this.exposeEventPromise(
        this.$socket,
        'exposeVisitorsRooms'
      );
      // let list = rooms.length ? rooms : ['No Visitors yet today.'];
      this.visitorsRooms = list.map((v) => {
        v['type'] = 'visitor';
        return v;
      });
      alert(this.visitorsRooms);
      this.listedRooms = [...this.availableRooms, ...this.visitorsRooms];
      this.log(`Visitors Rooms: ${JSON.stringify(list, null, '\t')}`, 'debug');
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
    getIndiaTime() {
      let t = mtz
        .utc()
        .tz('Asia/Kolkata')
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

    connectToServer() {
      const id = '4257650091';
      this.log('Connecting to Server...');
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != id
      ) {
        this.$socket.disconnect();
      }
      this.$socket.io.opts.query = {
        admin: 'Tao',
        id: id,
        nsp: 'enduringNet',
      };
      this.$socket.connect();
    },
  },

  async created() {
    await State.$fetch();
  },

  async mounted() {
    let self = this;
    self.zuluClock = self.getZuluTime();
    setInterval(self.getZuluTime, 60000);

    self.sistersClock = self.getSistersTime();
    setInterval(self.getSistersTime, 60000);

    self.singaporeClock = self.getSingaporeTime();
    setInterval(self.getSingaporeTime, 60000);

    self.indiaClock = self.getIndiaTime();
    setInterval(self.getiIndiaTime, 60000);

    this.log(this.pendingVisitors, 'alert');

    this.connectToServer();

    console.log('Admin.vue mounted');
  },
};
</script>
