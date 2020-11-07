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
            label="Pick your Room"
            persistent-hint
            return-object
            single-line
            @change="changingRoom"
          ></v-select>
        </v-col>

        <v-col>
          <v-text-field label="Occupancy" :value="occupancy"></v-text-field>
        </v-col>
      </v-row>
      <v-row v-if="roomIsReadyToEnter">
        <v-col>
          <div class="text-center">
            {{ checkedOut ? 'Check-in' : 'Check-out' }}
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="onEnterRoom"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn>
          </div>
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

    enabled: {
      type: Object,
    },
  },
  computed: {
    roomIsReadyToEnter() {
      let x =
        this.enabled.visitor.visitor &&
        this.openRooms.map((v) => v.room).includes(this.roomSelected.room);
      return x;
    },

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

    onEnterRoom() {
      this.$emit('roomEntered', this.roomSelected.room);
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
