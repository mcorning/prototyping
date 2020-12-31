<template>
  <div>
    <v-overlay :value="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <diaryCard />

    <!-- note use of v-model (because this snackbar will come and go, as necessary) -->
    <v-snackbar
      v-model="snackBar"
      :timeout="4000"
      color="primary"
      multi-line
      vertical
    >
      {{ feedbackMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-container fluid>
      <v-row dense justify="space-between" class="child-flex">
        <v-col
          ><visitorIdentityCard
            :log="log"
            @visitor="onVisitorReady($event)"
            @warned="onWarned($event)"
          />
        </v-col>
      </v-row>

      <v-alert
        :value="alert"
        dark
        dismissible
        border="left"
        type="error"
        elevation="10"
        colored-border
        prominent
        transition="scale-transition"
        >{{ alertMessage }}
      </v-alert>

      <v-row>
        <v-col>
          <roomIdentityCard :log="log" @roomSelected="onRoomSelected($event)"
        /></v-col>
      </v-row>
      <v-row v-if="showEntryRoomCard">
        <v-col>
          <roomEntryCard
            ref="button"
            :roomName="roomName"
            :log="log"
            :occupancy="occupancy"
            @roomChanged="onAct($event)"
        /></v-col>
      </v-row>

      <v-expansion-panels
        v-if="messages.length"
        v-model="panelState"
        multiple
        popout
      >
        <v-expansion-panel>
          <v-expansion-panel-header color="secondary lighten-3" ref="visits">
            Visits
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <dataTableCard :roomName="roomName" :log="log" />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header color="secondary lighten-3">
            Audit Trail
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <auditTrailCard :cons="cons" />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
  </div>
</template>
<script type="application/javascript" src="@/components/js/helpers.js"></script>

<script>
import base64id from 'base64id';

import * as easings from 'vuetify/es5/services/goto/easing-patterns';

import helpers from '@/components/js/helpers.js';
const { printJson, getNow } = helpers;

import moment from 'moment';

import Message from '@/models/Message';
import State from '@/models/State';
import Visitor from '@/models/Visitor';

import diaryCard from '@/components/cards/visitor/diaryCard';
import visitorIdentityCard from '@/components/cards/visitor/visitorIdentityCard';
import roomIdentityCard from '@/components/cards/visitor/roomIdentityCard';
import roomEntryCard from '@/components/cards/visitor/roomEntryCard';
import dataTableCard from '@/components/cards/dataTableCard';
import auditTrailCard from '@/components/cards/auditTrailCard';

import clc from 'cli-color';
// const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
// const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

// handle previously unhandled error
window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + message + '\n' + lineNo);
};

export default {
  name: 'LctVisitor',
  components: {
    diaryCard,
    visitorIdentityCard,
    roomIdentityCard,
    roomEntryCard,
    dataTableCard,
    auditTrailCard,
  },
  computed: {
    showDetails() {
      return this.messages.length;
    },

    firstTime() {
      let x = Visitor.all();
      return x.length === 0;
    },

    // fetch Messages for enabled visitor, if any
    // TODO Push this into Message.js as a static method
    visitorCheckins() {
      let x = this.messages.filter(
        (v) =>
          v.visitor == this.enabled.visitor.visitor && v.message == 'Entered'
      );
      return x;
    },

    roomName() {
      return this.enabled.room.room;
    },

    checkConnection() {
      const x = this.$socket.disconnected;
      return x;
    },

    visitorData() {
      return {
        visitors: this.visitors,
        checkedOut: this.checkedOut,
        btnType: this.btnType,
      };
    },

    exposureWarning() {
      if (!this.messages.length) return {};
      let payload = {
        array: this.messages,
        prop: 'room',
        val: 'sentTime',
      };
      return this.groupBy(payload);
    },

    roomIsReadyToEnter() {
      return this.rooms.includes(this.enabled.room.id) && this.yourId;
    },

    messages: {
      get() {
        return Message.all();
      },
      set(newVal) {
        // flatten newVal
        const msg = {
          id: base64id.generateId(),
          room: newVal.room,
          visitor: newVal.visitor.visitor,
          roomId: newVal.room,
          visitorId: newVal.visitor.id,
          nsp: newVal.nsp,
          sentTime: newVal.sentTime,
          message: newVal.message,
        };
        // static update function on Message model
        Message.update(msg);
      },
    },

    managedRoom: {
      get() {
        return this.state?.managerId;
      },
      set(newVal) {
        State.updateManagerId(newVal);
      },
    },
    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        console.log(newVal);
      },
    },
  },

  data: () => ({
    easing: 'easeInOutCubic',
    easings: Object.keys(easings),

    panelState: [],

    overlay: true,
    snackBar: true,
    connectionMessage: 'Provide a name to Connect to the Server.',
    disconnectedFromServer: true,
    showEntryRoomCard: false,
    feedbackMessage:
      'Thanks for making us safer together using Local Contact Tracing...',
    messageColor: 'secondary lighten-1',
    socketMessage: 'visitor',
    search: '',

    oldRoomId: '',
    changingRoom: false,
    rating: 3,
    alertIcon: 'mdi-alert',
    alertColor: '',
    alert: false,
    alertMessage: '',
    occupancy: 0,
    socketId: '',
    enabled: { visitor: {}, room: {}, canEnter: -1 },

    cons: [],
    rooms: [],
    socketServerOnline: false,
    visitFormat: 'HH:mm on ddd, MMM DD',
    checkedOut: true,
  }),

  sockets: {
    //#region Socket.io custom events
    availableRoomsExposed(rooms) {
      const msg = rooms
        ? `Available Rooms may not be open Rooms: ${printJson(rooms)}`
        : 'No Rooms are online at this time.';
      this.log(msg, 'Event: availableRoomsExposed');
    },

    // Server fires this event when a Room opens/closes
    // If the opened Room has a cached warning, send it now.
    openRoomsExposed(rooms) {
      const msg = rooms
        ? `Visitor sees open Rooms: ${printJson(rooms)}`
        : 'No Rooms open at this time.';
      this.log(msg, 'Event: openRoomsExposed');
      this.connectionMessage = rooms
        ? ''
        : 'There are no open Rooms at this time.';
    },

    // Event sent from Server to advise Visitor to self-quarantine
    exposureAlert(alertMessage) {
      this.onExposureAlert(alertMessage);
    },

    //#endregion
  },

  // Visitor emits exposureWarning to Server sending
  //    * the Visitor object and
  //    * a collection of Rooms and dates visited

  // Server emits exposureAlert to Visitor based on Room(s)' response to exposureWarning from Visitor
  //exposureAlert contains a primary message to the Visitors:
  //    * the Visitor who issued the exposureWarning sees a confirmation message,
  //    * the other Visitor(s) receive
  //       * a message recommending self-quarantine
  //       * a packet of dates of possible exposure that is stored in the Visitor log

  methods: {
    // handles @warned event from warnRoomCard which responds to the ACK from the server upon reciept of warning
    onWarned(data) {
      const { rooms, reason } = data;
      console.group(
        `[${getNow()}] EVENT: onWarned (Visitor.vue) - updating messages for ${
          this.enabled.visitor.visitor
        }'s visited Rooms:`
      );
      let roomNames = [];
      rooms.forEach((room) => {
        // memorialize the warnings
        let msg = {
          visitor: this.enabled.visitor,
          room: room.room,
          message: 'WARNED BY',
          sentTime: new Date().toISOString(),
        };
        this.messages = msg;
        console.log('New message:');
        console.log(printJson(msg));
        roomNames.push(room.room);
      });

      // for snackbar
      this.messageColor = 'success lighten-1';
      this.feedbackMessage = `Server acknowledges warning for Room(s)
        ${roomNames.join(', ')}.`;

      this.overlay = false;

      this.snackBar = true;
      console.groupEnd();
      console.warn(
        `End of Visitor's responsibility. Room(s) take over from here...`
      );
      console.log(' ');
    },

    //#region Main Events
    // main event (exposureWarning) sent to Server when a Visitor self-quarantines
    // of a Room is offline, cache the warning and send it to the Room when it returns online

    /*

A) There are two options for handling pending warnings:
  1) mark messages in Visitor's message entity in one of four ways
      a) sent (when Visitor warns an open Room)
      b) pending (when Visitor warns Rooms but one or more Rooms are closed and unable to process the warning in real time)
      c) alerted (when the Visitor receives an alert from one or more Rooms)
      d> blank (when the visit happens)

  2) delegate handling to Server
      a) no markup on message entries
      b) pending Rooms stay in server memory until pending Room opens

B) There are two ways to identify a pending Room:
  1) locally using a call to exposeOpenRooms on the server
  2) sending a warning to the Server and retrieving the warning in the ACK if the Server finds the Room is not open



Option A has the advantage of explicitly maintaining state on messages. but this value accrues as the Visitor processes more alerts and warnings.
Also, since a Visitor will likely warn only once the value of Option A derives from being able to rewarn closed Rooms.
But the downside to this advantage is that the Visitor is responsible for resending the warning when the Visitor processes an openRoomExposed event.
Specifically, If the Visitor is down and the Room is open, the Room won't see the warning.
Ironically, this problem is likely if the Visitor goes into quarantine or treatment and no longer uses LCT.

If the responsiblity goes to the Server, this temporal implication is minimal (and problematic only if the pending Rooms are stored in volatile memory).

See similar comments in the Room.vue notifyRoom event handler as it tries to deal with alerts and Visitors who are not online.
(NOTE: a Visitor, unlike a Room, should be able to recieve an alert as soon as the Visitor connects to the server (i.e., a Visitor cannot be closed))

*/

    // handles main incoming Visitor event from Server
    onExposureAlert(data) {
      const { event, message, visitor, room } = data;

      // prepare the Alert card content
      this.alert = true;
      this.alertIcon = 'mdi-alert';
      this.alertColor = 'red darken-4';
      this.alertMessage = message;

      // memorialize the wARNING
      let entry = printJson(
        (this.messages = {
          room: room,
          visitor: visitor,
          nsp: '',
          sentTime: new Date().toISOString(),
          message: 'ALERTED',
        })
      );
      // log the warning/alert in the Admin View
      this.log(entry, 'Alert Message');
    },
    //#endregion

    //#region Vue event handlers

    onAct(checkedOut) {
      let msg = {
        visitor: this.enabled.visitor,
        room: this.enabled.room.room,
        message: checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      if (this.$refs.visits) {
        this.$vuetify.goTo(this.$refs.visits, {
          duration: 300,
          offset: 0,
          easing: this.easing,
        });
      }

      let event = checkedOut ? 'enterRoom' : 'leaveRoom';

      this.emit({
        event: event,
        message: msg,
        ack: (ACK) => {
          this.occupancy = ACK.occupants;
        },
      });
      this.messageColor = checkedOut ? 'dark success' : 'dark warning ';
      this.feedbackMessage = checkedOut
        ? `Welcome to ${this.enabled.room.room}`
        : 'See you next time...';

      let m = checkedOut ? 'out of' : 'into';
      this.log(
        `You checked ${m} ${this.enabled.room.room} {${this.enabled.room.id}}`
      );
    },

    onRoomSelected(selectedRoom) {
      this.panelState = [0, 2];
      this.enabled.room = selectedRoom;
      this.showEntryRoomCard = true;
      this.connectionMessage = null;
      if (this.$refs.visits) {
        this.$vuetify.goTo(this.$refs.button, {
          duration: 300,
          offset: 0,
          easing: this.easing,
        });
      }
      console.log(printJson(this.enabled.room));
    },

    onVisitorReady(visitor) {
      // this.enabled holds two objects: room and visitor
      // visitor will be empty during OBX
      if (visitor) {
        this.enabled.visitor = visitor;
        console.log(printJson(this.enabled.visitor));
      }
    },

    // TODO why is this method here? we enter room with onAct() above...
    onEnterRoom(proceed) {
      if (proceed) {
        // disables the banner
        let msg = {
          visitor: this.enabled.visitor,
          room: this.enabled.room,
          message: this.checkedOut ? 'Entered' : 'Departed',
          sentTime: new Date().toISOString(),
        };
        const self = this;
        this.$socket.emit('enterRoom', msg, (ACK) => {
          if (ACK.error) {
            self.feedbackMessage = ACK.error;
            self.messageColor = 'error darken-2';
            alert(ACK.error);
          } else {
            self.occupancy = ACK.occupants;
            self.messageColor = 'success lighten-1';
            self.feedbackMessage = `Welcome to ${ACK.room.room.id}`;
          }
          this.trace({ caption: 'ACK: enterRoom', msg: ACK });
          this.log(ACK, 'ACKS');
        });
      }
    },
    //#endregion

    //#region utility functions

    emit(payload) {
      if (!this.$socket.id) {
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
      // this.$socket.emit(payload.event, payload.message, (ACK) => {
      //   this.occupancy = ACK.occupants;
      //   console.log(ACK);
      // });
    },

    exposeEventPromise(clientSocket, event) {
      return new Promise(function(resolve) {
        clientSocket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },

    getEnteredMessages(room, v) {
      return v.room == room && v.message.toLowerCase() == 'entered';
    },

    getRandomIntBetween(min, max) {
      // return Math.floor(Math.random() * Math.floor(max))-1;
      return Math.random() * (max - min) + min;
    },

    groupBy(payload) {
      const { array, prop, val } = payload;
      return array.reduce(function(acc, obj) {
        acc.set(obj[prop], (acc.get(obj[prop]) || []).concat(obj[val]));
        return acc;
      }, new Map());
    },

    // this is a (more?) functional way to do grouping
    groupByFn(arr, fn) {
      return arr
        .map(typeof fn === 'function' ? fn : (val) => val[fn])
        .reduce((acc, val, i) => {
          acc[val] = (acc[val] || []).concat(arr[i]);
          return acc;
        }, {});
    },

    groupMessagesByRoomAndDate(payload) {
      const { array, prop, val } = payload;
      let visitDates = [];
      return array
        .filter((v) => v[val]) // ignore Room Opened/Closed messages
        .reduce(function(a, c) {
          // if Message does not store the entire visitor and room objects
          // then c[prop] is sufficient; otherwise use c[prop].id
          let key = c[prop];
          if (!a[key]) {
            a[key] = {
              room: '',
              dates: [],
            };
          }
          visitDates.push(moment(c[val]).format('YYYY-MM-DD'));
          // if Message does not store the entire visitor and room objects
          // then c.room is sufficient; otherwise use c.room.room
          a[key] = {
            room: c.room,
            dates: visitDates,
          };
          return a;
        }, {});
    },

    // helper methods
    log(msg, type = 'information') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },
    trace(trace) {
      const { caption, msg } = trace;
      console.log(bold(highlight(caption)));
      console.log(bold(highlight(printJson(msg))));
    },

    //#endregion

    //#region other important emitters
    exposeOpenRooms() {
      let self = this;
      this.$socket.emit('exposeOpenRooms', null, (rooms) => {
        const msg = rooms.length
          ? 'Choose a Room to enter'
          : 'There are no open Rooms at this time.';

        console.groupCollapsed('All Rooms:');
        console.log(printJson(rooms));
        console.groupEnd();
        self.connectionMessage = msg;
        this.trace({ caption: 'ACK: exposeOpenRooms', msg: rooms });
      });
    },
  },

  //#endregion
  watch: {
    // in case we timeout on an async function
    overlay(val) {
      val &&
        setTimeout(() => {
          this.overlay = false;
        }, 10000);
    },
  },

  async created() {
    console.log('Visitor.vue created');
  },

  async mounted() {
    await State.$fetch();
    await Message.$fetch();
    await Visitor.$fetch();

    this.exposeOpenRooms();

    this.overlay = false;
    console.log('Visitor.vue mounted');
  },
};
</script>
