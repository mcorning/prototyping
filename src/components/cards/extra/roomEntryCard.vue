<template>
  <v-card>
    <v-card-title>Log into (out of) a Room</v-card-title>
    <v-card-subtitle
      >Currently, you are
      {{ checkedOut ? 'checked out of' : 'checked into' }} Room
      {{ roomName }}</v-card-subtitle
    >
    <v-card-text>
      <v-row dense>
        <v-col cols="6">
          <v-row dense>
            <v-col>
              <v-btn
                :color="checkedOut ? 'success' : 'warning'"
                fab
                dark
                @click="onChangeRoom"
              >
                <v-icon>{{ btnType }}</v-icon>
              </v-btn>
            </v-col></v-row
          >
          <v-row dense>
            <v-col> {{ checkedOut ? 'Check-in' : 'Check-out' }}</v-col>
          </v-row>
        </v-col>
        <v-col cols="6">
          <v-text-field
            label="Occupancy"
            readonly
            :value="occupancy"
          ></v-text-field>
        </v-col> </v-row
    ></v-card-text>
  </v-card>
</template>

<script>
import helpers from '@/mixins/helpers.js';

const { printJson } = helpers;

// This Visitor's version of roomIdentityCard.vue does not use the Room entity.
// This version listens for openRoomsExposed event to populate the rooms property.
export default {
  props: {
    roomName: { type: String },
    log: { type: Function },
    occupancy: { type: Number },
  },

  computed: {
    btnType() {
      return this.checkedOut ? 'mdi-account-plus' : 'mdi-account-minus';
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
    // openRoomsExposed(rooms) {
    // this.openRooms = rooms;
    // console.table(rooms);
    // this.log(
    //   `roomIdentityCard: ${printJson(this.openRooms)}`,
    //   'Event: openRoomsExposed'
    // );
    // },
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
      //  checkedOut instantiates as true,
      // meaning the default action is to EnterRoom
      // so on the second click, checkedOut will be false
      // and act will Leave Room
      this.checkedOut = !this.checkedOut;
      this.$emit('roomChanged', this.checkedOut);
    },

    changingRoom() {
      // send the Room data back to Visitor so it can add the Visitor data to emit with enterRoom on the Server
      this.log(printJson(this.roomSelected));
      this.$emit('roomSelected', this.roomSelected);
    },
  },

  async mounted() {
    this.openRooms = await this.exposeEventPromise('exposepenRooms');
  },
};
</script>
