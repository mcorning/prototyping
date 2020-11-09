<template>
  <v-card class="mx-auto" max-width="344" outlined>
    <v-card-text>
      <v-row>
        <v-col cols="6">
          <v-row>
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="onChangeRoom"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn></v-row
          >
          <v-row>
            {{ checkedOut ? 'Check-in' : 'Check-out' }}
          </v-row>
        </v-col>
        <v-col cols="6">
          <v-text-field label="Occupancy" :value="occupancy"></v-text-field>
        </v-col> </v-row
    ></v-card-text>
  </v-card>
</template>

<script>
import helpers from '@/components/js/helpers.js';

const { printJson } = helpers;

// This Visitor's version of roomIdentityCard.vue does not use the Room entity.
// This version listens for openRoomsExposed event to populate the rooms property.
export default {
  props: {
    log: { type: Function },

    rooms: {
      type: Array,
    },

    enabled: {
      type: Object,
    },
  },
  computed: {
    btnType() {
      return this.checkedOut ? 'mdi-account-plus' : 'mdi-account-minus';
    },

    occupancy() {
      return 1;
    },
  },
  data() {
    return {
      openRooms: [],
      checkedOut: true,
      roomSelected: { room: '', id: '' },
    };
  },
  sockets: {
    // depracated for Open Rooms (a subset of Available Rooms)
    availableRoomsExposed(rooms) {
      this.availableRooms = rooms;
      this.log(
        `roomIdentityCard: ${printJson(this.availableRooms)}`,
        'Event: availableRoomsExposed'
      );
    },
    openRoomsExposed(rooms) {
      this.openRooms = rooms;
      console.table(rooms);
      this.log(
        `roomIdentityCard: ${printJson(this.openRooms)}`,
        'Event: openRoomsExposed'
      );
    },
  },
  methods: {
    emit(payload) {
      if (!this.$socket.id) {
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    exposeEventPromise(event) {
      let self = this;
      return new Promise(function(resolve) {
        self.$socket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },

    onChangeRoom() {
      this.$emit('roomChanged', this.checkedOut);
      //  checkedOut instantiates as true,
      // meaning the default action is to EnterRoom
      // so on the second click, checkedOut will be false
      // and act will Leave Room
      this.checkedOut = !this.checkedOut;
    },

    changingRoom() {
      // send the Room data back to Visitor so it can add the Visitor data to emit with enterRoom on the Server
      this.log(printJson(this.roomSelected));
      this.$emit('roomSelected', this.roomSelected);
    },
  },

  async mounted() {
    let self = this;
    console.log('socket connected?', this.$socket.connected);
    this.log('Mounted', 'roomIdentityCard');
    this.openRooms = await this.exposeEventPromise('exposepenRooms');
    this.log(
      `Available Rooms: ${printJson(self.openRooms)}`,
      'roomIdentityCard'
    );
  },
};
</script>
