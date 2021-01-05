<template>
  <div>
    <v-overlay :value="overlay">
      <p>Connecting</p>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <roomIntroCard />

    <roomIdentityCard :log="log" :trace="trace" @open="onOpen" />

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
// const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
// const info = clc.cyan;
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
    // Visitor routine events
    checkIn(msg) {
      this.onCheckIn(msg);
    },

    checkOut(msg) {
      this.messages = msg;
    },

    // sent from Server after Visitor sends exposureWarning
    // data contains all the Rooms and dates visited by the subject Visitor

    notifyRoom(data, ack) {
      // visitor is an ID
      const { exposureDates, room, visitor, reason } = data;
      console.assert(exposureDates, 'No exposure dates!');
      try {
        //#region notifyRoom
        console.groupCollapsed(
          `[${this.getNow()}] EVENT: notifyRoom from [${visitor} to ${room} because ${reason}]`
        );
        // filter exposureDatess for getMessageDates
        const visitors = this.getMessageDates(this.visits);
        //#region Logging
        console.group(`[${this.getNow()}] Step 1) Gather the data.`);
        console.log(`Room's exposure dates:`);
        console.log(this.printJson(exposureDates));
        console.log(`Room's Visitor dates:`);
        console.log(this.printJson(visitors));
        console.groupEnd();
        //#endregion

        // iterate the dates a risky Visitor visited this Room
        exposureDates.forEach((visitedOn) => {
          console.log(`Processing ${visitedOn}`);

          // see who else was in the Room on this date
          if (visitors[visitedOn]) {
            // each Visitor in this list occupied the Room on the same day
            visitors[visitedOn].forEach((other) => {
              //#region Step 2
              console.group(
                `[${this.getNow()}] Step 2) EVENT: notifyRoom from processing alerts for ${
                  other.id
                }]`
              );
              let party;
              let msg;
              // this is the Visitor warning of exposure...
              if (other.id == visitor) {
                console.log(
                  `${visitor} warns they are in quarantine and may have exposed others.`
                );
                msg = 'WARNED BY';
                party = { visitor: visitor, id: visitor };

                this.messages = {
                  room: room,
                  visitor: party,
                  nsp: '',
                  sentTime: new Date().toISOString(),
                  message: msg,
                };
              }
              // ...else build up the warning for the other occupant
              else {
                this.handleOtherVisitors(room, visitedOn, reason, other);
              }

              console.groupEnd();
              //#endregion
            });
          }
        });
        console.log('Leaving notifyRoom');
        //#endregion groupEnd() in finally() block

        if (ack) ack(`${visitor.visitor}, ${room.room} alerted`);
      } catch (error) {
        // firewall: if, for any reason, exposureDates is not an array or visitors have no entries...
        console.groupEnd();
        this.log(error, 'ERROR: notifyRoom');
        ErrorService.onError(error);
      } finally {
        console.groupEnd();
        // ends notifyRoom region above
      }
    },
  },

  // Emitters:   Visitor            Server        Room
  // Handlers:   Server             Room          Serveer         Visitor
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
        room: other.id,
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
