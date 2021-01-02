<template>
  <v-div>
    <v-card>
      <v-card-title>See Open Rooms</v-card-title>
      <v-card-subtitle>{{ subTitle }}</v-card-subtitle>
      <v-card-text>
        <!-- <v-row>
        <v-col> -->
        <v-select
          v-model="roomSelected"
          :disabled="!checkedOut"
          :items="openRooms"
          item-text="room"
          item-value="id"
          :label="roomSelectedLabel"
          hint="Admins control this Room list. Room owners open and close."
          persistent-hint
          return-object
          single-line
          @change="onChangeRoom"
        ></v-select>
      </v-card-text>
    </v-card>
    <div ref="logIn"></div>
    <v-card v-if="showEntryRoomCard">
      <v-card-title
        >Log {{ checkedOut ? 'into' : 'out of' }} a {{ roomName }}</v-card-title
      >

      <v-card-text>
        <v-row dense>
          <v-col cols="1">
            <!-- Enter/Leave Room button -->
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on" class="text-center ">
                  <v-fab-transition>
                    <v-btn
                      :key="activeFab.icon"
                      :color="activeFab.color"
                      fab
                      large
                      bottom
                      left
                      class="v-btn--example"
                      @click="onCheckInOut"
                    >
                      <v-icon>{{ activeFab.icon }}</v-icon>
                    </v-btn>
                  </v-fab-transition>
                </span>
              </template>
              <span>{{ activeFab.tip }}</span>
            </v-tooltip>
          </v-col>

          <v-spacer></v-spacer>
          <v-col cols="6">
            <v-text-field
              label="Occupancy"
              readonly
              :value="occupancy"
            ></v-text-field>
          </v-col> </v-row
      ></v-card-text>
    </v-card>
  </v-div>
</template>

<script>
import helpers from '@/mixins/helpers.js';

const { printJson } = helpers;

export default {
  props: {
    roomName: { type: String },
    log: { type: Function },
    occupancy: { type: Number },
  },

  computed: {
    activeFab() {
      if (this.checkedOut) {
        return {
          color: 'success',
          icon: 'mdi-account-plus',
          tip: 'Leave Room',
        };
      } else {
        return {
          color: 'warning',
          icon: 'mdi-account-minus',
          tip: 'Enter Room',
        };
      }
    },
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
    btnType() {
      return this.checkedOut ? 'mdi-account-plus' : 'mdi-account-minus';
    },
  },

  data() {
    return {
      showEntryRoomCard: false,

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
    onChangeRoom() {
      this.showEntryRoomCard = true;

      this.$emit('changeRoom', this.roomSelected);
    },

    exposeEventPromise(event) {
      let self = this;
      return new Promise(function(resolve) {
        self.$socket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },

    onCheckInOut() {
      this.checkedOut = !this.checkedOut;
      this.$emit('act', this.checkedOut);
    },
  },

  watch: {},

  async mounted() {
    let self = this;
    console.log('socket connected?', this.$socket.connected);
    this.log('Mounted', 'roomIdentityCard');
    this.openRooms = await this.exposeEventPromise('exposepenRooms');
    this.log(`Open Rooms: ${printJson(self.openRooms)}`, 'roomIdentityCard');
  },
};
</script>
