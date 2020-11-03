<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <v-select
            v-model="rooms.room"
            :items="rooms"
            item-text="room"
            item-value="id"
            label="Pick your Room"
            hint="You can log a visit when a Room is online"
            persistent-hint
            @change="changingRoom = true"
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
              @click="act(roomId)"
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
export default {
  props: {
    rooms: {
      type: Array,
    },
    roomIsReadyToEnter: {
      type: Boolean,
    },
    btnType: {
      type: String,
    },

    checkedOut: {
      type: Boolean,
    },
  },
  computed: {
    occupancy() {
      return 1;
    },
  },
  data() {
    return {
      roomId: '',
      changingRoom: false,
    };
  },
  methods: { changingRooms() {} },
  async mounted() {
    console.log('socket connected?', this.$socket.connected);
  },
};
</script>
