<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <v-select
            v-model="roomSelected"
            :items="openRooms"
            item-text="room"
            item-value="id"
            :label="roomSelectedLabel"
            hint="Room managers control this Room list"
            persistent-hint
            return-object
            single-line
            autofocus
            @change="onChangingRoom"
          ></v-select>
        </v-col>
      </v-row>
    </v-card-text>
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
  },
  computed: {
    roomSelectedLabel() {
      return 'Pick your Room';
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
      console.groupCollapsed('EVENT: openRoomsExposed - Open Rooms:');
      console.log(this.printJson(rooms));
      const msg = rooms
        ? `roomIdentityCard: ${printJson(this.openRooms)}`
        : 'No open Rooms yet.';
      this.log(msg, 'Event: openRoomsExposed');
      console.groupEnd();
    },
  },
  methods: {
    // TODO Use this method in all components tha emit events to Server
    exposeEventPromise(event) {
      let self = this;
      return new Promise(function(resolve) {
        self.$socket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },

    onChangingRoom() {
      // send the Room data back to Visitor so it can add the Visitor data to emit with enterRoom on the Server
      this.log(printJson(this.roomSelected));
      this.$emit('roomSelected', this.roomSelected);
    },

    printJson(json) {
      return JSON.stringify(json, null, 3);
    },
  },

  async mounted() {
    let self = this;
    console.log('socket connected?', this.$socket.connected);
    this.log('Mounted', 'roomIdentityCard');
    this.openRooms = await this.exposeEventPromise('exposepenRooms');
    this.log(`Open Rooms: ${printJson(self.openRooms)}`, 'roomIdentityCard');
  },
};
</script>
