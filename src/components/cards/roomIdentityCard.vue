<template>
  <v-container>
    <!-- believe autoconnect=true obviates connectToServer -->
    <!-- <v-dialog v-if="!firstTime" v-model="dialog" max-width="340">
      <v-card>
        <v-card-title class="headline"
          >Connecting {{ room.room }} to LCT</v-card-title
        >
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="connectToServer()">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog> -->
    <v-dialog v-model="deleteDialog" max-width="260">
      <v-card>
        <v-card-title class="headline">Delete Room?</v-card-title>
        <v-card-text
          >Be careful. If you delete a Room you will not see exposure warnings
          from past Visitors.</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="deleteRoom()">
            Yes
          </v-btn>

          <v-btn color="green darken-2" text @click="deleteDialog = false">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="newDialog" max-width="260">
      <v-card>
        <v-card-title class="headline">Add a Room to LCT?</v-card-title>
        <v-card-text
          >After you add a Room, you will connect to the LCT server. Open the
          Room to enable Visitors to enter.</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="addRoom()">
            Yes
          </v-btn>

          <v-btn color="green darken-2" text @click="newDialog = false">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card v-if="firstTime">
      <v-card-title>First time (or starting over)?</v-card-title>
      <v-card-text
        >Visitors enter Rooms. Rooms, then, must have a public name that
        everybody will recognize.</v-card-text
      >
      <!-- <v-card-text>
      You can manage more than one Room, but you can only open one Room at a
      time.
    </v-card-text> -->
      <v-card-text>
        When you open a Room, the Server adds your Room to a list on Visitor
        pages so they can choose your Room and enter.
      </v-card-text>
    </v-card>

    <v-card v-else>
      <v-card-title>Manage Your Room</v-card-title>
      <v-card-subtitle
        >Visitors can log in to open Rooms only. Toggle Room Open/Close using
        button below.
      </v-card-subtitle>
    </v-card>

    <v-card>
      <v-card-text>
        <v-row align="center" justify="space-between">
          <v-col cols="8">
            <v-text-field
              v-model="room.room"
              :label="roomSelectedLabel"
              :prepend-icon="statusIcon"
              persistent-hint
              :hint="room.room == '' ? '' : hint"
              clearable
              @change="onUpdateRoom($event)"
            ></v-text-field>
            <!-- <v-btn v-if="room.room == ''" text @click="deleteDialog = true"
              >Delete</v-btn
            > -->
            <!-- deprecated multi Room support -->
            <!-- <v-select
              v-model="room"
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
            ></v-select> -->
            <!-- deprecated multi Room support -->
          </v-col>

          <v-col cols="1">
            <!-- Open/Close Room button -->
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
        </v-row>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-if="!firstTime"
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
  </v-container>
</template>

<script>
import Message from '@/models/Message';
import Room from '@/models/Room';

import helpers from '@/components/js/helpers.js';
const { printJson, getNow } = helpers;

import clc from 'cli-color';
// const success = clc.green.bold;
const error = clc.red.bold;
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

  computed: {
    isConnected() {
      return this.$socket.connected;
    },

    buttonIsDisabled() {
      return !this.room || this.disableButton;
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

    roomIsClosed() {
      return this.query.closed;
    },

    roomSelectedLabel() {
      return `Your Room's public name:`;
    },

    btnType() {
      return this.closed ? 'mdi-door-open' : 'mdi-door-closed-lock';
    },

    // deprecated multi Room support
    // source for room dropdown
    // rooms() {
    //   let allRooms = Room.all();
    //   return allRooms;
    // },

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
      newDialog: false,
      query: {},
      deleteDialog: false,
      firstTime: false,
      // dialog: false,
      socketStatus: '',

      disableButton: true,

      timeout: 10000,
      reconnected: false,
      btnLabels: ['', 'Close'],
      openSnackbar: false,
      feedbackMessage:
        'Thanks for making us safer together using Local Contact Tracing...',
      closed: true,
      mainIcon: 'mdi-home-outline',
      room: {},
      statusIcon: 'mdi-lan-disconnect',
      hint: '',
    };
  },

  sockets: {
    //#region socket.io reserved events
    connect() {
      const { room, id, nsp } = this.query;

      if (this.reconnected) {
        console.log('Reconnected. No need to connect(). Returning');
        return;
      }

      if (!room) {
        console.log('First time. Leaving connect().');
        this.$emit('open');

        return;
      }

      console.group('Step X: connect()');
      console.warn(
        this.$socket.id,
        this.$socket.connected,
        this.$socket.io.opts
      );

      console.log(`Connecting ${room}`);
      this.log(
        `Server connected using Id: ${id}, Room: ${room}, and nsp ${nsp} `,
        'roomIdentityCard.vue'
      );

      this.statusIcon = 'mdi-lan-connect';
      this.hint = `ID: ${this.room.id}`;
      console.log('Connected?', this.$socket.connected);
      if (this.$socket.connected) {
        this.configureSnackbar(
          `Open ${room} now? `,
          ['Yes', 'No'],
          5000,
          this.onOpen
        );
      }
      console.groupEnd();
      console.log(' ');
    },

    reconnect(reason) {
      if (!this.query) {
        return;
      }
      this.reconnected = true;
      let feedbackMessage = `Server has reconnected you automagically.
      Do you want to be Open or Closed?`;
      let btnLabels = ['Open', 'Closed'];
      let timeout = 5;
      this.configureSnackbar(feedbackMessage, btnLabels, timeout, this.onOpen);

      console.group('onReconnect');
      console.warn(
        `[${getNow()}] ${printJson(this.query)} Recconnect ${reason}`,
        'roomIdentityCard.vue'
      );
      const msg = {
        room: this.query.room,
        message: 'Reconnected',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;
      this.log(`Reconnect ${reason}`, 'roomIdentityCard.vue');
      console.groupEnd();
    },

    //
    disconnect(reason) {
      this.statusIcon = 'mdi-lan-disconnect';
      if (reason != 'io client disconnect') {
        console.log(error(reason));
      }
      this.log(`Disconnect: ${reason}`, 'roomIdentityCard.vue');
    },

    //#region Other reserved events
    error(reason) {
      // passed from Server when a non-LCT socket is blocked from connecting
      console.log(`Error ${reason}`, 'roomIdentityCard.vue');
      // this.enableButton();
      // this.$emit('open');
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
    // TODO move next three methods to helpers
    getQuery() {
      let query = this.$socket.io.opts.query || {
        visitor: '',
        id: '',
        nsp: '',
      };
      return query;
    },

    printQuery() {
      const query = this.getQuery();
      if (!query.id) {
        return 'Empty query';
      }
      return printJson(query);
    },

    parseParams(querystring) {
      // parse query string
      const params = new URLSearchParams(querystring);

      const obj = {};

      // iterate over all keys
      for (const key of params.keys()) {
        if (params.getAll(key).length > 1) {
          obj[key] = params.getAll(key);
        } else {
          obj[key] = params.get(key);
        }
      }

      return obj;
    },

    configureSnackbar(message, buttons, timeout, callback) {
      this.feedbackMessage = message;
      this.btnLabels = buttons;
      this.timeout = timeout;

      this.openSnackbar = true;
      setTimeout(() => {
        console.log(`Timed out.`);
        if (callback) {
          callback();
        }
      }, this.timeout);
    },

    resetSnackbar() {
      this.btnLabels = ['Yes'];
      this.openSnackbar = false;
      this.timeout = 10000;
    },

    setFirstTime(val) {
      if (val == true) {
        this.room = {};
        this.hint =
          'Use a unique name you could use to invite in someone from your community.';
      } else {
        this.hint = `ID: ${this.room.id} is ${this.closed ? 'closed' : 'open'}`;
      }
      this.firstTime = val;
    },

    connectToServer() {
      // do we need this check?
      if (!this.room.id) {
        this.setFirstTime(true);
        return;
      }

      // this.dialog = false;
      this.firstTime = false;
      this.query = {
        room: this.room.room,
        id: this.room.id,
        nsp: '',
      };

      this.$socket.connect();
    },

    act() {
      if (this.closed) {
        this.onOpen();
      } else {
        this.onClose();
      }
    },

    // onNewRoom() called by:
    //    Room name's text-field component
    //
    //    it adds a Room to the Room entity (including a new id for the server to use during connection there)
    //    then it connects to the server
    onUpdateRoom(newVal) {
      console.log('Old Room', this.getQuery().id);
      this.$socket.disconnect(true);
      Room.update(newVal, this.room.id, this.nsp)
        .then((r) => {
          // update returns an array
          console.assert(r.length, 'Expected an array of Room objects');
          this.room = r[0];

          console.log('New Room:', r);
          // this.connectToServer();
        })
        .catch((e) => console.log(e));
    },

    enableButton() {
      this.disableButton = false;
      this.resetSnackbar();
    },

    //#region  handlers for speedDial
    onOpen(room = this.room.room) {
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
      this.hint = `ID: ${this.room.id} is ${this.closed ? 'closed' : 'open'}`;
      // State.changeRoom(this.room.id, this.closed);
    },

    onClose(room = this.room.room) {
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
      console.log('onClose() payload:');
      console.log(printJson(payload));
      this.emit(payload);
      this.resetSnackbar();
      this.hint = `ID: ${this.room.id} is ${this.closed ? 'closed' : 'open'}`;

      // are we still updating Room state for closed?
      //this.onUpdateRoom();
    },
    //#endregion

    emit(payload) {
      // open or closed
      this.query.closed = this.closed;
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
      let status = this.query
        ? `${this.$socket.id} ${this.$socket.connected} ${JSON.stringify(
            this.query,
            null,
            3
          )} `
        : 'No connected Room socket';
      return status;
    },

    deleteRoom() {
      Room.delete(this.room.id).then(() => {
        this.$socket.disconnect(true);
        this.log(
          `Deleted ${printJson(this.query.room)} and disconnected ${
            this.$socket.id
          }`
        );
        this.deleteDialog = false;
        this.setFirstTime(true);
      });
    },

    selectedRoomInit() {
      console.group('Step 2: selectedRoomInit');
      this.query = this.parseParams(this.$socket.io.opts.query);
      this.room = Room.query().first();
      if (this.room) {
        this.setFirstTime(false);

        console.log('Found Room');
        return;
      }
      this.room = {};
      console.log('First time');
      this.setFirstTime(true);

      console.groupEnd();
    },
  },

  /*
    Managing Rooms
    this.room is the v-model for the Room dropdown
    The first thing we do is check for a delete intention (newVal is null)
    Otherwise, we try to close the current Room (oldVal) and open the selected Room (newVal)
    Otherwise, if oldVal is null, we have a new Room, so we skip the close Room operation

    Then there's this:
    newVal = this.$socket.io.opts.query if oldVal is null, so do nothing
*/

  watch: {
    room(newVal, oldVal) {
      // for some reason, when Room is null, the watch fires with the first character entered in the text-field.
      // and when the text-field edit is done, it sets this.firsttime to false, so we can proceed past this point then.
      if (this.firstTime) {
        return;
      }
      console.group('Step 3: room watch');

      // deleted Room (viz., Room text field is blank?
      if (!newVal.room || newVal.room == 'null') {
        console.log(
          `${
            this.firstTime
              ? 'First time.'
              : 'No newVal for Room. Delete continues...'
          }`
        );
        this.deleteDialog = !this.firstTime;
        return;
      }

      // change the Room's name
      if (oldVal?.id) {
        console.log('oldVal and newVal means updating Room name');
        console.log(`Connecting Room ${newVal.room}`);
        const msg = {
          room: this.getQuery().room,
          message: 'Closed',
          sentTime: new Date().toISOString(),
        };
        // update Message entity
        this.messages = msg;
        this.printQuery();
        // window.location.reload();
      }

      console.log('Connection options:');
      this.$socket.io.opts.query = {
        room: this.room.room,
        id: this.room.id,
        nsp: '',
      };
      console.log(printJson(this.$socket.io.opts.query));
      this.$socket.connect();

      console.groupEnd();
      console.log(' ');
    },
  },

  created() {},

  async mounted() {
    await Message.$fetch();
    await Room.$fetch();

    console.group('Step 1: mounted()');

    console.log('Initializing socket with');
    console.log(
      highlight(
        this.$socket.id,
        this.$socket.connected,
        printJson(this.$socket.io.opts.query)
      )
    );
    console.groupEnd();
    console.log(' ');

    this.selectedRoomInit();
  },
};
</script>
