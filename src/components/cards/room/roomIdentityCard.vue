<template>
  <div>
    <v-card>
      <v-card-title>Manage Your Rooms</v-card-title>
      <v-card-subtitle
        >Currently,
        {{
          $socket.connected
            ? connectedMessage
            : 'you are disconnected. Open or create a Room below.'
        }}
      </v-card-subtitle>
      <v-snackbar
        v-model="openSnackbar"
        color="primary"
        multi-line
        vertical
        :timeout="timeout"
        centered
      >
        {{ openSnackbarText }}
        <template v-slot:action="{ attrs }">
          <v-btn color="white" text v-bind="attrs" @click="onOpen">
            Yes
          </v-btn>
          <v-btn
            color="white"
            text
            v-bind="attrs"
            @click="openSnackbar = false"
          >
            No
          </v-btn>
        </template>
      </v-snackbar>
      <v-card-text>
        <v-row align="center" justify="space-between">
          <v-col cols="8">
            <v-text-field
              v-if="newRoom || !rooms.length"
              label="Enter your Room name:"
              hint="Use a unique name you could use to invite in someone from your community."
              persistent-hint
              clearable
              @change="onUpdateRoom($event)"
            />
            <v-select
              v-if="rooms.length && !newRoom"
              v-model="selectedRoom"
              :items="rooms"
              item-text="room"
              item-value="id"
              :label="roomSelectedLabel"
              return-object
              single-line
              :prepend-icon="statusIcon"
              @change="onRoomSelected"
              :hint="hint()"
            ></v-select>
          </v-col>
          <v-col cols="1" class="text-center">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on" class="text-center">
                  <speedDial
                    :room="true"
                    :mainIcon="mainIcon"
                    @added="onAddRoom"
                    @deleted="onDeleteRoom"
                    @open="onOpen"
                    @close="onClose"
                  />
                </span>
              </template>
              <span>Room Tasks</span>
            </v-tooltip>
          </v-col>
          <v-spacer></v-spacer>
          <!-- <v-col class="col-md-4 pl-10">
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
          </v-col> -->
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
import speedDial from '@/components/cards/SpeedDial';

import helpers from '@/components/js/helpers.js';
const { printJson, getNow } = helpers;

export default {
  props: {
    log: {
      type: Function,
    },
    trace: {
      type: Function,
    },
  },

  components: { firstTimeCard, speedDial },

  computed: {
    openSnackbarText() {
      return `Would like to open ${this.selectedRoom.room} now?`;
    },

    connectedMessage() {
      return `you are connected. Open ${this.selectedRoom.room} below so Visitors can use LCT.`;
    },

    roomSelectedLabel() {
      return 'Select your Room';
    },
    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },

    firstTime() {
      return this.rooms.length < 1;
    },

    // source for selectedRoom dropdown
    rooms() {
      let allRooms = Room.all();
      return allRooms;
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
      mainIcon: 'mdi-home-outline',
      newRoom: false,
      selectedRoom: {},
      statusIcon: 'mdi-lan-disconnect',
      openSnackbar: false,
      timeout: 10000,
    };
  },

  sockets: {
    //#region socket.io reserved events
    connect() {
      // ignore any non-Room sockets
      if (!this.$socket.io.opts.query) {
        this.$socket.disconnect();
        return;
      }

      const { room, id, nsp, closed } = this.$socket.io.opts.query;
      console.group('onConnect');

      console.log(`${room} ${closed ? 'closed' : 'open'}`);
      this.log(
        `Server connected using Id: ${id}, Room: ${room}, and nsp ${nsp} `,
        'roomIdentityCard.vue'
      );
      console.groupEnd();
      // cache last Room used
      State.changeRoomId(id);
      // set icon to indicate connect() handled
      this.statusIcon = 'mdi-lan-connect';
      this.openSnackbar = true;
    },

    disconnect(reason) {
      this.statusIcon = 'mdi-lan-disconnect';

      this.log(`Disconnect: ${reason}`, 'roomIdentityCard.vue');
    },

    //#region Other socket events
    error(reason) {
      this.log(`Error ${reason}`, 'roomIdentityCard.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'roomIdentityCard.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'roomIdentityCard.vue');
    },
    reconnect(reason) {
      console.group('onReconnect');
      console.warn(
        `[${getNow()}] ${printJson(
          this.$socket.io.opts.query
        )} Recconnect ${reason}`,
        'roomIdentityCard.vue'
      );
      this.log(`Recconnect ${reason}`, 'roomIdentityCard.vue');
      console.groupEnd();
    },
    reconnect_attempt(reason) {
      this.log(`Reconnect_attempt ${reason}`, 'roomIdentityCard.vue');
    },
    reconnecting(reason) {
      this.log(`Reconnecting ${reason}`, 'roomIdentityCard.vue');
    },
    reconnect_error(reason) {
      this.log(`Reconnect_error ${reason}`, 'roomIdentityCard.vue');
    },
    reconnect_failed(reason) {
      this.log(`Reconnect_failed ${reason}`, 'roomIdentityCard.vue');
    },
    //#endregion

    //#endregion end socket.io reserved events
  },

  methods: {
    // onUpdateRoom() called by:
    //    newRoom's text-field component
    //
    //    it adds a Room to the Room entity (including a new id for the server to use during connection there)
    //    then it connects to the server
    onUpdateRoom(newVal) {
      this.newRoom = false;

      this.selectedRoom.room = newVal;
      this.selectedRoom.id = base64id.generateId();
      Room.update(this.selectedRoom.room, this.selectedRoom.id, this.nsp)
        .then((r) => {
          console.log('New Room:', r);
          this.onRoomSelected();
        })
        .catch((e) => console.log(e));
    },

    // onRoomSelected called by:
    //    onUpdateRoom() when user adds a Room
    //    selectedRomm select component
    //    selectedRoomInit() method called by mounted()
    //
    // onRoomSelected() handles connection options.
    //    it ignores connect() when the connected Room tries to connect again (for what ever reason)
    //    if the selectedRoom changes, it disconnects the old Room and connects the new Room
    //    otherwise i updates the query (including the open/closed state of the Room)
    onRoomSelected() {
      try {
        if (this.$socket.connected) {
          console.log(`${this.$socket.io.opts.query.room} is  connected`);
          if (this.$socket.io.opts.query.room == this.selectedRoom.room) {
            return;
          }
          console.log(
            `${this.selectedRoom.room} is not connected. Disconnecting ${this.$socket.io.opts.query.room}`
          );
          this.$socket.disconnect();
        }
        this.log(`Connecting ${this.selectedRoom.room} to Server...`);

        this.$socket.io.opts.query = {
          room: this.selectedRoom.room,
          id: this.selectedRoom.id,
          closed: this.closed,
          nsp: '',
        };
        this.$socket.connect();
      } catch (error) {
        console.error('onRoomSelected():', error);
        console.warn(`Disconnecting socket ${this.$socket.id}`);
        this.$socket.disconnect();
      }
    },

    onChangeRoom(val) {
      // should this go later in the function?
      State.changeRoomId(this.selectedRoom.id);

      let msg;
      if (!val || this.rooms.length > 1) {
        msg = {
          room: this.selectedRoom.id,
          // TODO why deleted?
          message: val ? 'Closed' : 'Deleted',
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'closeRoom',
          message: msg,
          ack: (ack) => {
            // TODO why length?
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = val ? 'success' : 'warning';
            this.alert = true;
            this.log(`Closed Room ${this.selectedRoom.id}`);
          },
        });
      }
      if (val && this.rooms.length) {
        msg = {
          room: this.selectedRoom.room,
          id: this.selectedRoom.id,
          message: 'Opened',
          state: this.closed,
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: 'openRoom',
          message: msg,
          ack: (ack) => {
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = 'success';
            this.alert = true;
            this.log('Opened Room');
          },
        });
      }
    },

    onAddRoom() {
      this.newRoom = true;
    },

    onDeleteRoom() {
      this.selectedRoom = null;
    },

    //#region  handlers for speedDial
    onOpen() {
      this.openSnackbar = false;
      this.act('open');
    },

    onClose() {
      this.act('close');
    },
    //#endregion

    // called by Open/Close Room button
    act(action) {
      const msg = {
        id: this.selectedRoom.id,
        room: this.selectedRoom.room,
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
      this.closed = action == 'close';
      this.emit(payload);
    },

    emit(payload) {
      // open or closed
      this.$socket.io.opts.query.state = payload.message.message;
      // this.closed = payload.message.message;
      let msg =
        `Emitting ${payload.event}` +
        (payload.message.room ? ` to server for ${payload.message.room}` : '');
      this.log(msg);
      this.$socket.emit(payload.event, payload.message, (ack) => {
        this.trace({ caption: `ACK: ${payload.event}:`, msg: ack });
        this.log(ack, 'ACKS');
      });
    },

    hint() {
      return `ID: ${this.$socket.id}`;
    },
    status() {
      let status = this.$socket.io.opts.query
        ? `${this.$socket.id} ${this.$socket.connected} ${JSON.stringify(
            this.$socket.io.opts.query,
            null,
            3
          )} `
        : 'No connected Room socket';
      return status;
    },

    findRoomWithId(id = this.selectedRoom?.id) {
      let v = Room.find(id) || '';
      return v;
    },

    selectedRoomInit() {
      let id = State.find(0)?.roomId;
      let r = this.findRoomWithId(id);
      if (r) {
        this.selectedRoom = r;
        this.onRoomSelected();
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
    // let self = this;
    await Message.$fetch();
    await State.$fetch();
    await Room.$fetch();
    this.selectedRoomInit();
  },
};
</script>
