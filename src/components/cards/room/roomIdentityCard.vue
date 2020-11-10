<template>
  <div>
    <v-card>
      <v-card-text>
        <v-row align="center" justify="space-between">
          <v-col>
            <v-text-field
              v-if="onboard || firstTime"
              label="Enter the public name of your site or gathering"
              hint="This name should be uniquely recognizable to all Rooms"
              persistent-hint
              clearable
              autofocus
              @change="onUpdateRoom"
            ></v-text-field>

            <v-select
              v-else
              v-model="selectedRoom"
              :items="rooms"
              item-text="room"
              item-value="id"
              :label="roomSelectedLabel"
              clearable
              return-object
              single-line
              @change="onEmitRoom"
            ></v-select>
          </v-col>
          <v-col class="col-md-4 pl-10">
            <div v-if="selectedRoom.id" class="text-center">
              <v-btn
                :color="closed ? 'success' : 'warning'"
                fab
                dark
                @click="act"
              >
                <v-icon>{{ btnType }}</v-icon>
              </v-btn>
              <span class="pl-3">
                {{ closed ? 'Open Room' : 'Close Room' }}
              </span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <firstTimeCard v-if="firstTime" />
  </div>
</template>

<script>
import base64id from 'base64id';

import Message from '@/models/Message';
import Room from '@/models/Room';
import State from '@/models/State';
import firstTimeCard from '@/components/cards/room/firstTimeCard';

const ONBOARD = 'Onboard my Room...';
export default {
  components: { firstTimeCard },

  computed: {
    roomSelectedLabel() {
      return 'Select your Room';
    },
    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },

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
      let id = State.find(0)?.roomId;
      let r = this.findRoomWithId(id);
      return r;
    },

    messages: {
      get() {
        return Message.all();
      },
      set(newVal) {
        // static update function on Message model
        Message.update(newVal);
      },
    },
  },

  data() {
    return {
      closed: true,

      newRoom: '',
      nsp: 'enduringNet',
      selectedRoom: {},
    };
  },

  methods: {
    // called by Open/Close Room button
    act() {
      const msg = {
        room: this.selectedRoom.room,
        id: this.selectedRoom.id,
        message: this.closed ? 'Opened' : 'Closed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      const event = this.closed ? 'openRoom' : 'closeRoom';
      const payload = {
        event: event,
        message: msg,
        ack: (ack) => {
          this.alertColor = 'success';
          this.alertMessage = ack.message;
          this.alert = true;
        },
      };
      this.closed = !this.closed;
      this.$emit('act', payload);
    },

    findRoomWithId(id = this.selectedRoom?.id) {
      let v = Room.find(id) || '';
      return v;
    },

    onEmitRoom() {
      if (this.selectedRoom) {
        State.changeRoomId(this.selectedRoom.id);
        this.$emit('room', this.selectedRoom);
      }
    },

    onUpdateRoom(newVal) {
      this.selectedRoom.room = newVal;
      this.selectedRoom.id = base64id.generateId();
      Room.update(newVal, this.selectedRoom.id, this.nsp)
        .then((r) => console.log('New Room:', r))
        .catch((e) => console.log(e));
      this.onEmitRoom();
    },
    selectedRoomInit() {
      let id = State.find(0)?.roomId;
      let r = this.findRoomWithId(id);
      if (r) {
        this.selectedRoom = r;
      } else {
        this.selectedRoom = { room: '', id: '' };
      }
    },
  },
  watch: {
    selectedRoom(newVal, oldVal) {
      if (!newVal) {
        const self = this;
        Room.delete(oldVal.id).then((allRooms) => {
          console.log('self.selectedRoom :>> ', self.selectedRoom);
          console.log('Rooms after delete:', allRooms);
          if (allRooms.length == 0) {
            console.log('self.selectedRoom', self.selectedRoom);
          }
        });
      }
      if (!this.selectedRoom) {
        this.selectedRoom = { room: '', id: '' };
      }
    },
  },
  async mounted() {
    await Message.$fetch();

    await State.$fetch();
    await Room.$fetch();
    this.selectedRoomInit();
  },
};
</script>
