<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <v-select
            v-model="roomSelected"
            :items="availableRooms"
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
              @click="act(roomSelected.room)"
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
// This version listens for availableRoomsExposed event to populate the rooms property.
export default {
  props: {
    log: { type: Function },
    rooms: {
      type: Array,
    },
    //   roomIsReadyToEnter: {
    //     type: Boolean,
    //   },
    visitor: {
      type: Object,
    },

    //   checkedOut: {
    //     type: Boolean,
    //   },
  },
  computed: {
    roomIsReadyToEnter() {
      return (
        this.availableRooms.includes(this.roomSelected.room) &&
        this.visitor.visitor
      );
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
      availableRooms: [],
      checkedOut: true,
      roomSelected: { room: '', id: '' },
    };
  },
  sockets: {
    availableRoomsExposed(rooms) {
      this.availableRooms = rooms;
      this.log(
        `roomIdentityCard: ${printJson(this.availableRooms)}`,
        'Event: availableRoomsExposed'
      );
    },
  },
  methods: {
    exposeEventPromise(event) {
      let self = this;
      return new Promise(function(resolve) {
        self.$socket.emit(event, null, (results) => {
          resolve(results);
        });
      });
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
    this.availableRooms = await this.exposeEventPromise('exposeAvailableRooms');
    this.log(
      `Available Rooms: ${printJson(self.availableRooms)}`,
      'roomIdentityCard'
    );
  },
};
</script>
