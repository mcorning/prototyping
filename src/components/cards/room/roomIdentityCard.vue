<template>
  <v-container>
    <firstTimeCard v-if="firstTime" />

    <v-card>
      <v-card-text>
        <v-row align="center" justify="space-between">
          <v-col>
            <v-text-field
              v-if="onboard"
              label="Enter the public name of your site or gathering"
              hint="This name should be uniquely recognizable to all Rooms"
              persistent-hint
              clearable
              @change="updateRoom"
            ></v-text-field>

            <v-select
              v-else
              v-model="selectedRoom"
              :items="rooms"
              item-text="room"
              item-value="id"
              label="Pick your Room"
              clearable
              return-object
              single-line
              @change="emitRoom"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import base64id from 'base64id';

import Room from '@/models/Room';
import State from '@/models/State';
import firstTimeCard from '@/components/cards/room/firstTimeCard';

const ONBOARD = 'Onboard my Room...';
export default {
  components: { firstTimeCard },

  computed: {
    firstTime() {
      // rooms[0]==ONBOARD
      return this.rooms.length < 2;
    },

    onboard() {
      // we might ber deleting the selectedRoom
      return this.selectedRoom?.room === ONBOARD;
    },

    // source for selectedRoom dropdown
    // merges
    rooms() {
      let rooms = [{ room: ONBOARD, id: '' }];
      let allRooms = Room.all();
      let x = [...allRooms, ...rooms];
      return x;
    },

    lastRoom() {
      let id = State.find(0).roomId;
      let r = this.findRoomWithId(id);
      return r;
    },
  },

  data() {
    return {
      newRoom: '',
      nsp: 'enduringNet',
      selectedRoom: { room: this.lastRoom, id: '' },
    };
  },

  methods: {
    findRoomWithId(id = this.selectedRoom?.id) {
      let v = Room.find(id) || '';
      return v;
    },

    emitRoom() {
      if (this.selectedRoom) {
        State.changeRoomId(this.selectedRoom.id);
        this.$emit('room', this.selectedRoom);
      }
    },

    updateRoom(newVal) {
      this.selectedRoom.room = newVal;
      this.selectedRoom.id = base64id.generateId();
      Room.update(newVal, this.selectedRoom.id, this.nsp)
        .then((r) => console.log('New Room:', r))
        .catch((e) => console.log(e));
      this.emitRoom();
    },
    selectedRoomInit() {
      let id = State.find(0).roomId;
      let r = this.findRoomWithId(id);
      this.selectedRoom = r;
    },
  },
  watch: {
    selectedRoom(newVal, oldVal) {
      if (!newVal) {
        Room.delete(oldVal.id);
      }
    },
  },
  async mounted() {
    await State.$fetch();
    await Room.$fetch();
    this.selectedRoomInit();
  },
};
</script>
