<template>
  <div>
    <v-card>
      <v-card-title>Manage Your Rooms</v-card-title>
      <v-card-subtitle
        >Visitors can log in to open Rooms only. Toggle Room Open/Close using
        button below.
      </v-card-subtitle>

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
              persistent-hint
              :hint="hint"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="1">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on" class="text-center ">
                  <v-fab-transition>
                    <v-btn
                      :disabled="buttonIsDisabled"
                      :key="activeFab.icon"
                      :color="activeFab.color"
                      fab
                      large
                      bottom
                      left
                      class="v-btn--example"
                      @click="act()"
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
    <v-snackbar
      v-model="openSnackbar"
      :timeout="timeout"
      color="primary"
      multi-line
      vertical
      centered
    >
      {{ feedbackMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="onOpen()">
          {{ btnLabels[0] }}
        </v-btn>
        <v-btn color="white" text v-bind="attrs" @click="enableButton()">
          {{ btnLabels[1] }}
        </v-btn>
      </template>
    </v-snackbar>
    <firstTimeCard v-if="firstTime" />
  </div>
</template>

<script>
import base64id from 'base64id';

import Message from '@/models/Message';
import Room from '@/models/Room';
import State from '@/models/State';
import firstTimeCard from '@/components/cards/firstTimeCard';
// import speedDial from '@/components/cards/SpeedDial';

import helpers from '@/components/js/helpers.js';
const { printJson, getNow } = helpers;

import clc from 'cli-color';
// const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
// const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
// const bold = clc.bold;

export default {
  props: {
    log: {
      type: Function,
    },
    trace: {
      type: Function,
    },
  },

  components: {
    firstTimeCard,
    //  speedDial
  },

  computed: {
    buttonIsDisabled() {
      return !this.selectedRoom.room || this.disableButton;
    },

    activeFab() {
      if (this.closed) {
        return { color: 'success', icon: 'mdi-door-open', tip: 'Open Room' };
      } else {
        return {
          color: 'orange',
          icon: 'mdi-door-closed-lock',
          tip: 'Close Room',
        };
      }
    },

    query() {
      return this.$socket.io.opts.query;
    },
    roomIsClosed() {
      return this.$socket.io.opts.query.closed;
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

    state() {
      return State.find(0);
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
      disableButton: true,

      timeout: 10000,
      reconnected: false,
      btnLabels: ['', 'Close'],
      openSnackbar: true,
      feedbackMessage:
        'Thanks for making us safer together using Local Contact Tracing...',
      closed: true,
      mainIcon: 'mdi-home-outline',
      newRoom: false,
      selectedRoom: {},
      statusIcon: 'mdi-lan-disconnect',
      hint: '',
    };
  },

  sockets: {
    //#region socket.io reserved events
    connect() {
      console.group('Step 0: connect()');
      console.warn(
        this.$socket.id,
        this.$socket.connected,
        this.$socket.io.opts
      );

      console.groupEnd();
      console.log(' ');

      if (this.reconnected) {
        this.log('Reconnected. No need to connect(). Returning');
        return;
      }

      // ignore any non-Room sockets
      if (!this.$socket.io.opts.query || this.$socket.io.opts.query.id == '') {
        this.$socket.disconnect(true);
        return;
      }

      const { room, id, nsp, closed } = this.$socket.io.opts.query;
      console.group('onConnect');
      console.log(`Connecting ${room}`);
      this.log(
        `Server connected using Id: ${id}, Room: ${room}, and nsp ${nsp} `,
        'roomIdentityCard.vue'
      );
      console.groupEnd();
      // cache last Room used
      State.changeRoom(id, closed);
      // set icon to indicate connect() handled
      this.statusIcon = 'mdi-lan-connect';
      this.hint = `ID: ${this.selectedRoom.id}`;
      this.feedbackMessage = `Open ${room} now?`;
      this.btnLabels = ['Yes', 'No'];
      this.openSnackbar = true;
      this.timeout = -1;
    },

    reconnect(reason) {
      this.reconnected = true;
      this.feedbackMessage = `Server has reconnected you automagically.
      Do you want to be Open or Closed?`;
      this.btnLabels = ['Open', 'Closed'];
      this.timeout = -1;
      this.openSnackbar = true;

      console.group('onReconnect');
      console.warn(
        `[${getNow()}] ${printJson(
          this.$socket.io.opts.query
        )} Recconnect ${reason}`,
        'roomIdentityCard.vue'
      );
      const msg = {
        room: this.$socket.io.opts.query.room,
        message: 'Reconnected',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;
      this.log(`Reconnect ${reason}`, 'roomIdentityCard.vue');
      console.groupEnd();
    },
    //#region Other reserved events
    disconnect(reason) {
      this.statusIcon = 'mdi-lan-disconnect';

      this.log(`Disconnect: ${reason}`, 'roomIdentityCard.vue');
    },
    error(reason) {
      this.log(`Error ${reason}`, 'roomIdentityCard.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'roomIdentityCard.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'roomIdentityCard.vue');
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
    act() {
      if (this.closed) {
        this.onOpen();
      } else {
        this.onClose();
      }
    },

    roomStateToText(closed = this.closed) {
      return closed ? 'Closed' : 'Open';
    },
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
    //    selectedRoomInit() method called by mounted()
    //    NOTE: build 12.21.12.21 deprecated multiple Room support
    //
    // onRoomSelected() handles connection options.
    //    it ignores connect() when the connected Room tries to connect again (for what ever reason)
    //    if the selectedRoom changes, it disconnects the old Room and connects the new Room
    //    otherwise it updates the query (including the open/closed state of the Room) and conects to Server
    onRoomSelected(caller) {
      console.log(highlight(`Step 4: onRoomSelected ${caller}`));

      try {
        this.reconnected = false;

        if (this.$socket.connected) {
          console.log(`${this.$socket.io.opts.query.room} is  connected`);
          if (this.$socket.io.opts.query.room == this.selectedRoom.room) {
            // if client and server are in sync, no need for further actions
            return;
          }

          console.log(
            `This socket does not belong to ${this.selectedRoom.room}. Disconnecting ${this.$socket.io.opts.query.room}`
          );
          this.$socket.disconnect();
        }

        this.log(`Connecting ${this.selectedRoom.room} to Server...`);

        this.$socket.io.opts.query = {
          room: this.selectedRoom.room,
          id: this.selectedRoom.id,
          closed: this.state?.roomClosed,
          nsp: '',
        };

        this.$socket.connect();
      } catch (error) {
        console.error('onRoomSelected:', error);
      }
    },

    onChangeRoom(val) {
      // should this go later in the function?
      State.changeRoom(this.selectedRoom.id, this.closed);

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
      const room = this.selectedRoom.room;
      this.closed = false;
      this.enableButton();
      const msg = {
        room: room,
        message: 'Open',
        sentTime: new Date().toISOString(),
      };
      // update Message entity
      this.messages = msg;

      const payload = {
        event: 'openRoom',
        message: msg,
        ack: (ack) => {
          this.alertColor = 'success';
          this.alertMessage = ack.message;
          this.alert = true;
        },
      };
      this.emit(payload);
      this.resetSnackbar();
      this.hint = `ID: ${this.selectedRoom.id} is ${
        this.closed ? 'closed' : 'open'
      }`;
      State.changeRoom(this.selectedRoom.id, this.closed);
    },
    enableButton() {
      this.disableButton = false;
      this.resetSnackbar();
    },
    onClose(room = this.selectedRoom.room) {
      this.closed = true;
      this.enableButton();

      const msg = {
        room: room,
        message: 'Closed',
        sentTime: new Date().toISOString(),
      };
      // update Message entity
      this.messages = msg;

      const payload = {
        event: 'closeRoom',
        message: msg,
        ack: (ack) => {
          this.alertColor = 'success';
          this.alertMessage = ack.message;
          this.alert = true;
        },
      };
      this.emit(payload);
      this.resetSnackbar();
      this.hint = `ID: ${this.selectedRoom.id} is ${
        this.closed ? 'closed' : 'open'
      }`;
      State.changeRoom(this.selectedRoom.id, this.closed);
    },
    //#endregion

    // called by Open/Close Room button
    // act(action) {
    //   const msg = {
    //     room: this.selectedRoom.room,
    //     message: this.closed ? 'Opened' : 'Closed',
    //     sentTime: new Date().toISOString(),
    //   };
    //   this.messages = msg;

    //   const event = this.closed ? 'openRoom' : 'closeRoom';
    //   const payload = {
    //     event: event,
    //     message: msg,
    //     ack: (ack) => {
    //       this.alertColor = 'success';
    //       this.alertMessage = ack.message;
    //       this.alert = true;
    //     },
    //   };
    //   this.closed = action == 'close';
    //   this.emit(payload);
    //   this.resetSnackbar();
    // },

    emit(payload) {
      // open or closed
      this.$socket.io.opts.query.closed = this.closed;
      // this.closed = payload.message.message;
      let msg =
        `Emitting ${payload.event}` +
        (payload.message.room ? ` to server for ${payload.message.room}` : '');
      this.log(msg);
      this.$socket.emit(payload.event, payload.message, (ack) => {
        this.trace({ caption: `ACK: ${payload.event}:`, msg: ack });
        this.log(ack, 'ACKS');
      });
      // tell Room to open the Visits expansion-bar
      this.$emit('open');
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

    resetSnackbar() {
      this.btnLabels = ['Yes'];
      this.openSnackbar = false;
      this.timeout = 10000;
    },

    deleteRoom(room) {
      const self = this;
      Room.delete(room.id).then((allRooms) => {
        this.log(
          `Deleted ${printJson(room)} and disconnected ${this.$socket.id}`
        );
        this.$socket.disconnect(true);
        if (allRooms.length == 0) {
          console.log('self.selectedRoom', self.selectedRoom);
        }
      });
      // if we deleted the last saved Room, reset the v-model
      if (!this.selectedRoom) {
        this.selectedRoom = { room: '', id: '' };
      }
    },

    findRoomWithId(id = this.selectedRoom?.id) {
      let v = Room.find(id) || '';
      return v;
    },

    selectedRoomInit() {
      console.warn('Step 2: selectedRoomInit');

      let id = State.find(0)?.roomId;
      let r = this.findRoomWithId(id);
      if (r) {
        // setting selectedRoom will trigger watch that calls onRoomSelected that connects to Server
        this.selectedRoom = r;
      } else {
        this.selectedRoom = { room: '', id: '', closed: true };
      }
    },
  },

  /*
    Managing Rooms
    this.selectedRoom is the v-model for the Room dropdown
    The first thing we do is check for a delete intention (newVal is null)
    Otherwise, we try to close the current Room (oldVal) and open the selected Room (newVal)
    Otherwise, if oldVal is null, we have a new Room, so we skip the close Room operation

    Then there's this:
    newVal = this.$socket.io.opts.query if oldVal is null, so do nothing
*/

  watch: {
    selectedRoom(newVal, oldVal) {
      console.group('Step 3: selectedRoom watch');
      console.warn(
        this.$socket.id,
        this.$socket.connected,
        this.$socket.io.opts
      );
      console.groupEnd();
      console.log(' ');

      if (!newVal) {
        this.deleteRoom(oldVal);
        return;
      }

      if (oldVal?.id) {
        this.onClose(oldVal);
        this.onOpen(newVal);
        return;
      }

      this.onRoomSelected();
    },
  },
  created() {
    console.group('Step -1: created()');
    console.warn(this.$socket.id, this.$socket.connected, this.$socket.io.opts);
    console.groupEnd();
    console.log(' ');
  },

  async mounted() {
    // let self = this;
    await Message.$fetch();
    await State.$fetch();
    await Room.$fetch();

    console.group('Step 1: mounted()');
    console.warn(this.$socket.id, this.$socket.connected, this.$socket.io.opts);
    console.groupEnd();
    console.log(' ');

    this.selectedRoomInit();
  },
};
</script>
