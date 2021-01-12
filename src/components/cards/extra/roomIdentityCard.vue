<template>
  <v-card>
    <v-card-title>See Open Rooms</v-card-title>
    <v-card-subtitle>{{ subTitle }}</v-card-subtitle>
    <v-card-text>
      <!-- <v-row>
        <v-col> -->
      <v-select
        v-model="roomSelected"
        :items="openRooms"
        item-text="room"
        item-value="id"
        :label="roomSelectedLabel"
        hint="Admins control this Room list. Room owners open and close."
        persistent-hint
        return-object
        single-line
      ></v-select>
      <!-- </v-col>
      </v-row> -->
    </v-card-text>
  </v-card>
</template>

<script>
import helpers from '@/mixins/helpers.js';
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
    subTitle() {
      let text = 'Currently, there ';
      const ct = this.openRooms.length;
      switch (ct) {
        case 0:
          text += 'are 0';
          break;
        case 1:
          text += 'is 1';
          break;
        default:
          text += `are ${ct}`;
          break;
      }
      return (text += ` open Room${ct == 1 ? '' : 's'}`);
    },

    roomSelectedLabel() {
      return 'Pick your Room';
    },
  },
  data() {
    return {
      openRooms: [],
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
    // console.groupCollapsed('EVENT: openRoomsExposed - Open Rooms:');
    // console.log(printJson(rooms));
    // const msg = rooms
    //   ? `roomIdentityCard: ${printJson(this.openRooms)}`
    //   : 'No open Rooms yet.';
    // this.log(msg, 'Event: openRoomsExposed');
    // console.groupEnd();
    // },
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
    },
  },

  watch: {
    roomSelected(newVal, oldVal) {
      if (oldVal.id) this.$emit('leaveRoom', oldVal);
      this.$emit('roomSelected', this.roomSelected);
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
