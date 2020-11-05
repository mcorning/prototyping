<template>
  <v-card>
    <v-card-text>
      <v-row align="center" justify="space-between">
        <!-- <v-col>
          <v-text-field
            v-model="newRoom"
            label="Enter the public name of your site or gathering"
            hint="This name should be uniquely recognizable to all Rooms"
            persistent-hint
            clearable
            @change="updateRoom"
          ></v-text-field>
        </v-col>
        <v-col cols="1" class="text-center">
          OR
        </v-col> -->
        <v-col>
          <v-select
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
</template>

<script>
import Room from '@/models/Room';
import State from '@/models/State';
import base64id from 'base64id';

export default {
  computed: {
    onboard() {
      return !this.rooms.length || this.selectedRoom.room === 'Onboard my Room';
    },

    rooms() {
      let rooms = [{ room: 'Onboard my Room', id: '' }];
      let allRooms = Room.all();
      return [...rooms, ...allRooms];
    },

    lastRoom() {
      let id = State.find(0).visitorId;
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
      if (this.selectedRoom.room == 'Onboard my Room') {
        let p = prompt('Enter your Room name');
        if (!p) {
          return;
        }
        this.selectedRoom.room = p;
        this.updateRoom();
        alert('Added Room ' + this.selectedRoom.room);
      }

      let v = this.findRoomWithId();
      State.changeYourId(v.id);
      this.$emit('room', v);
    },

    // update IndexedDb and set values for selection
    updateRoom() {
      this.selectedRoom.id = base64id.generateId();
      Room.update(this.selectedRoom.room, this.selectedRoom.id, this.nsp)
        .then((r) => console.log('New Room:', r))
        .catch((e) => console.log(e));
    },
    // updateRoom(newRoom) {
    //   if (!this.selectedRoom) {
    //     this.selectedRoom = { room: newRoom, id: '' };
    //   }
    //   if (newRoom) {
    //     this.selectedRoom.id = base64id.generateId();
    //     // static update function on Room model
    //     Room.update(newRoom, this.selectedRoom.id, this.nsp).catch((e) =>
    //       console.log(e)
    //     );

    //     // static changeYourId function on State model
    //     State.changeYourId(this.selectedRoom.id);

    //     // you may want to do this in Room.vue
    //     // this.connectToServer();

    //     this.$emit('room', this.room);
    //     this.selectedRoom.room = newRoom;
    //   }
    // },
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
  },
};
</script>
