<template>
  <div>
    <v-overlay :value="overlay">
      <p>Connecting</p>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <roomIntroCard />

    <roomIdentityCard
      :log="log"
      :trace="trace"
      @open="onOpen"
      @cancel="overlay = false"
    />

    <v-expansion-panels
      v-if="messages.length"
      v-model="panelState"
      multiple
      popout
    >
      <v-expansion-panel>
        <v-expansion-panel-header color="secondary lighten-3">
          Visits
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <dataTableCard :roomName="selectedRoom.room" :log="log" />
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
  </div>
</template>

<script>
/*
Room.vue has one UI responsibility and one functional:
  1) control all the vue components for Room operations
  2) handle messages from the LCT server

The <roomIdentityCard/> component handles connecting Rooms to the LCT server
*/
import base64id from 'base64id';

import moment from 'moment';

import helpers from '@/mixins/helpers.js';
// const { printJson, getNow } = helpers;

import ErrorService from '@/Services/ErrorService';

import Message from '@/models/Message';
import State from '@/models/State';

import roomIntroCard from '@/components/cards/roomIntroCard';
import roomIdentityCard from '@/components/cards/roomIdentityCard';
import dataTableCard from '@/components/cards/dataTableCard';
import auditTrailCard from '@/components/cards/auditTrailCard';

import clc from 'cli-color';
const error = clc.red.bold;
const success = clc.green.bold;
// const warn = clc.yellow;
const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;

window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  this.log(error.stack, 'Error');
  alert('onerror: ' + error.stack);
};

const local = process.env.NODE_ENV == 'development';

export default {
  name: 'LctRoom',

  components: {
    // systemBarTop,
    roomIntroCard,
    roomIdentityCard,
    dataTableCard,
    // systemBarBottom,
    auditTrailCard,
  },

  computed: {
    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        this.log(`State gets${newVal}, but we don't use it...odd.`);
      },
    },

    messages: {
      get() {
        return Message.all();
      },
      set(newVal) {
        const { room, visitor, nsp, sentTime, message } = newVal;
        // flatten newVal
        const msg = {
          id: base64id.generateId(),
          room: room,
          visitor: visitor.visitor,
          roomId: room,
          visitorId: visitor.id,
          nsp: nsp,
          sentTime: sentTime,
          message: message,
        };
        // static update function on Message model
        Message.update(msg);
      },
    },
    visits() {
      console.group('All parties affected by warning and alerts:');
      console.log(this.messages);
      console.groupEnd();
      return this.messages.filter((v) => v.message == 'Entered');
    },
    showDetails() {
      console.log(local);
      let x = this.$showDetails;
      return x;
    },
  },

  data: () => ({
    panelState: [],
    overlay: true,

    visitFormat: 'HH:mm on ddd, MMM DD',
    // showDetails: local,
    socketMessage: 'room',
    selectedRoom: { room: '', id: '' },
    search: '',

    rating: 3,
    deleting: false,
    dialog: false,
    alert: false,
    alertColor: 'error',
    alertMessage: '',
    alertIcon: 'mdi-alert',

    isConnected: false,
    cons: [],
    occupancy: 0,
    socketUri: '',
    hasRoomManager: false,
    daysBack: 0,
    today: 'YYYY-MM-DD',

    logHeaders: [
      { text: 'Message', value: 'message' },
      { text: 'Type', value: 'type' },
      { text: 'Sent  ', value: 'sentTime' },
    ],

    alerts: [],
    yourId: '',

    // Vuetify provides validation
    rules: {
      required: (value) => !!value || 'Required.',
      counter: (value) => {
        if (!value) {
          return false;
        }
        value?.length <= 20 || 'Max 20 characters';
      },
      nameDelimiter: (value) => {
        if (!value) {
          return false;
        }
        value.includes('.');
      },
      email: (value) => {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(value) || 'Invalid e-mail.';
      },
    },
  }),

  sockets: {
    stepTwoServerNotifiesRoom(data, ack) {
      if (!this.visits.length) {
        console.log(
          error(
            "No Visits. How did somebody Warn a Room they haven't entered yet?"
          )
        );
        return;
      }
      // data is coming in as an array, presumably because Server is using a Map for warnings and we are iterating that map
      console.log('stepTwoServerNotifiesRoom data:', this.printJson(data));
      const { exposureDates, visitor, reason, room } = data;

      console.log(success(`reason: ${reason}`));
      console.log(success(`exposureDates: ${exposureDates}`));
      const visitors = this.getMessageDates(this.visits);
      if (!visitors) {
        console.log(error('No visitors'));
        return;
      }

      exposureDates.forEach((visitedOn) => {
        if (!visitors[visitedOn]) {
          console.log(error(`No visitors on ${visitedOn}`));
          return;
        }

        const exposedVisitors = visitors[visitedOn].filter(
          (v) => v.id != visitor.id
        );

        if (!exposedVisitors.length) {
          const msg = 'Visitor was alone in the Room. No alerts necessary.';
          console.log(info(msg));
          this.messages = {
            room: room,
            visitor: visitor,
            nsp: '',
            sentTime: new Date().toISOString(),
            message: msg,
          };
          return;
        }

        console.log(
          success(
            `Alerting Visitors on ${visitedOn} (excluding ${
              visitor.id
            }): ${this.printJson(exposedVisitors)}`
          )
        );

        this.$socket.emit(
          'stepThreeRoomSendsVisitorsToServer',
          {
            exposedVisitors: exposedVisitors,
            room: room,
          },
          this.stepTwoServerNotifiesRoomAck
        );

        if (ack) ack(`${visitor.visitor}, ${room.room} alerted`);
      });

      // override visitor.visitor because Room only attaches Visitor ID to an exposure warning
      visitor.visitor = visitor.id;

      this.messages = {
        room: room,
        visitor: visitor,
        nsp: '',
        sentTime: new Date().toISOString(),
        message: 'WARNED BY',
      };
    },

    // Visitor routine events
    checkIn(msg) {
      this.onCheckIn(msg);
    },

    checkOut(msg) {
      this.messages = msg;
    },
  },

  // Emitters:   Visitor            Server        Room
  // Handlers:   Server             Room          Server          Visitor
  // Event path: exposureWarning -> notifyRoom -> alertVisitor -> exposureAlert

  // Room handles notifyRoom event from Server
  //   * based on data in exposureWarning from Visitor
  //       * Visitor object
  //       * collection of Room/dates
  // exposureAlert contains a primary message to the Visitors:
  //    * the Visitor who issued the exposureWarning sees a confirmation message,
  //    * the other Visitor(s) receive
  //       * a message recommending self-quarantine
  //       * a packet of dates of possible exposure that is stored in the Visitor log

  // Room emits alertVisitor to Server sending
  //    * a Visitor object composed of data received when Visitors entered Room
  //         * visitor:   nickname of Visitor
  //         * visitorId: Visitor's generated ID

  methods: {
    handleOtherVisitors(room, visitedOn, reason, other) {
      const msg = `EXPOSURE ALERT: On ${visitedOn}, you occupied ${room} with another visitor who reports: [ ${reason ||
        'being in quarantine'} ]. If you haven't been tested, do so, and self-quarantine for 14 days.`;

      const alert = {
        // visitor: { visitor: other.visitor, id: other.id },
        visitor: { visitor: other.visitor, id: other.id },
        message: msg,
        room: room,
        sentTime: new Date().toISOString(),
      };
      console.log('Alerting other(s) with:');
      console.log(alert);

      this.$socket.emit('alertVisitor', alert, (result) => {
        this.trace({ caption: `ACK: alertVisitor (other):`, msg: result });

        this.log(result, 'ACK: alertVisitor');
        this.messages = {
          room: room,
          visitor: { visitor: other.visitor, id: other.id },
          nsp: '',
          sentTime: new Date().toISOString(),
          message: result,
        };
      });
    },

    onCheckIn(msg) {
      this.messages = msg;
    },

    onOpen() {
      this.panelState = [0, 2];
      this.overlay = false;
    },

    groupMessagesByDateAndVisitor(payload) {
      const { array, prop, val, visitor } = payload;
      console.log('groupMessagesByDateAndVisitor - payload:');
      console.log(this.printJson(payload));
      return array.reduce(function(a, c) {
        let key = moment(c[prop]).format('YYYY-MM-DD');
        if (!a[key]) {
          a[key] = [];
        }
        a[key].push({ id: c[val], visitor: c[visitor] });
        return a;
      }, {});
    },

    getMessageDates(messages) {
      console.groupCollapsed(
        `[${this.getNow()}] Room Client: handling onNotifyRoom: Input data:`
      );
      // console.log(this.printJson(data));
      let visitors = this.groupMessagesByDateAndVisitor({
        array: messages,
        prop: 'sentTime',
        val: 'visitorId',
        visitor: 'visitor',
      });
      console.log('Room Entered message dates:');
      console.log(this.printJson(visitors));
      console.groupEnd();

      return visitors;
    },

    //#region - other methods

    // end main methods

    // helper methods

    log(msg, type = 'info') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },

    trace(trace) {
      const { caption, msg } = trace;
      console.log(bold(highlight(caption)));
      console.log(bold(highlight(this.printJson(msg))));
    },

    stepTwoServerNotifiesRoomAck(data) {
      console.log('stepTwoServerNotifiesRoomAck: visitors exposed:', data);
      const msg = data === 0 ? 'No need to process further' : ' ';
      console.log(info('\t' + msg));
      this.log(
        `Number of exposed Visitors: ${data}`,
        'ACK: stepTwoServerNotifiesRoomAck'
      );
    },
    // end helper methods

    //#endregion
  },

  mixins: [helpers],

  async created() {},

  async mounted() {
    await Message.$fetch();
    await State.$fetch();
    // console.log('Room.vue mounted');
  },
};
</script>
