<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row>
        <v-col v-if="hasRoomManager">
          <!-- <span lass="small">Room Manager: {{ managedRoom }}</span>
      <v-spacer></v-spacer>
      <v-checkbox v-model="hasRoomManager" label="RM" small>
        {{ hasRoomManager }}</v-checkbox
      > -->
        </v-col>
        <v-col>IO:{{ $socket.io.uri }}</v-col>
        <v-col class="text-right">{{ ver }} </v-col>
      </v-row>
    </v-system-bar>
    <v-card>
      <v-card-title>Room Admin</v-card-title>
      <v-card-subtitle>Monitor Socket.io Server</v-card-subtitle>
      <v-btn @click="getAvailableRooms()">Available Rooms</v-btn>
      <v-btn @click="getOccupiedRooms()">Occupied Rooms</v-btn>
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

window.onerror = function(message) {
  /// what you want to do with error here
  alert('onerror: ' + message);
};

export default {
  name: 'LctRoomAdmin',
  data() {
    return {
      rating: 0,
      logHeaders: [
        { text: 'Message', value: 'message' },
        { text: 'Sent  ', value: 'sentTime' },
      ],
      cons: [],
    };
  },
  sockets: {
    // socket.io reserved events
    occupiedRoomsExposed(data) {
      let msg =
        'Occupied Rooms\n\n' +
        'Room: ' +
        data[0][0] +
        '\nOccupying Sockets:\n' +
        Object.keys(data[0][1].sockets)
          .toString()
          .split(',')
          .join('\n');

      alert(msg);
    },

    availableRoomsExposed(data) {
      let msg =
        'Online Unoccupied Rooms\n\n' +
        (data
          ? data
              .toString()
              .split(',')
              .join('\n')
          : 'No Rooms online right now.');
      alert(msg);
    },

    availableRooms(rooms) {
      this.log(`Available Rooms: ${rooms}`);
    },

    updatedOccupancy(payload) {
      if (payload.room == this.roomId) {
        this.occupancy = payload.occupancy;
      }
      this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    },

    // Visitor iterates their messages taking one Room visit (viz., Room name and visit date) at a time.
    // The Room receives the Visitor's visit date
    notifyRoom(payload, ack) {
      const { date, room } = payload;
      // override the incoming date to format for comparing same day
      let visitedKey = moment(date).format('YYYYMMDD');
      console.log('Visit Date:', date, visitedKey);
      console.log('All Messages');
      console.table(this.messages);
      console.log();

      let entries = this.messages.filter(
        (visit) =>
          visit.room == room && visit.message.toLowerCase() == 'entered'
      );
      console.log(`Room entries for ${room}`);
      console.table(entries);
      console.log();

      let visitorEntries = entries.filter((visit) => {
        let visitKey = moment(visit.sentTime).format('YYYYMMDD');
        console.log(visitKey);
        return visitKey == visitedKey;
      });
      console.log('visitors');
      console.table(visitorEntries);
      console.log();

      // now map over visitors for this date, and emit alertVisitor for each exposed visit
      let notified = visitorEntries.map((entry) => {
        let msg = `${entry.visitor}, on ${date}, BE ADVISED: you may have been exposed to Covid. Self quarantine.`;
        this.emit({
          event: 'alertVisitor',
          message: {
            visitor: entry.visitor,
            message: msg,
            sentTime: new Date().toISOString(),
          },
          ack: (ack) => {
            this.log(ack);
          },
        });
      });
      if (ack) ack('alert sent');

      this.alertMessage = notified.length
        ? `Visitor warning triggered Exposure Alert to ${notified.length} other visitors to ${room} after ${date}`
        : `Exposure Alert does not apply: No other visitor(s) to ${room} after ${date}`;
      this.alertColor = 'warning';
      this.alertIcon = 'mdi-home-alert';
      this.alert = true;
    },
  },

  methods: {
    getOccupiedRooms() {
      this.$socket.emit('exposeOccupiedRooms');
    },
    getAvailableRooms() {
      this.$socket.emit('exposeAvailableRooms');
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
  },

  async created() {},

  async mounted() {},
};
</script>
