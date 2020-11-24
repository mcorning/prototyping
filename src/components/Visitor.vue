<template>
  <div>
    <systemBarTop>
      <!-- <v-col class="text-center">UA: {{ userAgent }}</v-col> -->
    </systemBarTop>

    <diaryCard />
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

    <v-container>
      <v-row dense justify="space-between">
        <v-col
          ><visitorIdentityCard @visitor="OnvVsitorReady($event)" />
        </v-col>
        <v-col v-show="$socket.connected">
          <!-- put this back later 
                  :rooms="rooms" -->
          <roomIdentityCard :log="log" @roomSelected="onRoomSelected($event)"
        /></v-col>
      </v-row>
      <v-row v-if="showEntryRoomCard">
        <roomEntryCard
          :log="log"
          :occupancy="occupancy"
          @roomChanged="onAct($event)"
        />
      </v-row>
    </v-container>

    <warnRoomCard
      :visitor="enabled.visitor"
      :log="log"
      @warned="onWarned($event)"
    />

    <connectionBanner
      :connectionMessage="connectionMessage"
      @reconnect="onReconnect"
    ></connectionBanner>

    <messageBanner :bgcolor="messageColor">
      {{ feedbackMessage }}</messageBanner
    >

    <systemBarBottom
      :socketMessage="socketMessage"
      @showDetails="showDetails = !showDetails"
      :log="log"
    ></systemBarBottom>
    <div v-if="showDetails">
      <dataTableCard :roomName="roomName" :log="log" />

      <auditTrailCard :cons="cons" />
    </div>
  </div>
</template>
<script type="application/javascript" src="@/components/js/helpers.js"></script>

<script>
import base64id from 'base64id';

import helpers from '@/components/js/helpers.js';
const { printJson, getNow } = helpers;

import moment from 'moment';

import Message from '@/models/Message';
import Room from '@/models/Room';
import State from '@/models/State';
import systemBarTop from '@/components/cards/systemBarTop';
import diaryCard from '@/components/cards/visitor/diaryCard';
import visitorIdentityCard from '@/components/cards/visitor/visitorIdentityCard';
import roomIdentityCard from '@/components/cards/visitor/roomIdentityCard';
import roomEntryCard from '@/components/cards/visitor/roomEntryCard';
import connectionBanner from '@/components/cards/visitor/connectionBanner';
import messageBanner from '@/components/cards/visitor/messageBanner';
import warnRoomCard from '@/components/cards/visitor/warnRoomCard';
import systemBarBottom from '@/components/cards/systemBarBottom';
import dataTableCard from '@/components/cards/dataTableCard';
import auditTrailCard from '@/components/cards/auditTrailCard';

// handle previously unhandled error
window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + message + '\n' + lineNo);
};

export default {
  name: 'LctVisitor',
  components: {
    systemBarTop,
    diaryCard,
    visitorIdentityCard,
    roomIdentityCard,
    roomEntryCard,
    connectionBanner,
    messageBanner,
    warnRoomCard,
    systemBarBottom,
    dataTableCard,
    auditTrailCard,
  },
  computed: {
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
          room: newVal.room.room,
          visitor: newVal.visitor.visitor,
          roomId: newVal.room.id,
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

    pastRooms() {
      return Room.all().map((v) => v.roomId);
    },

    userAgent() {
      let ua = navigator.userAgent;
      let userAgent;
      if (ua.includes('Edg')) {
        userAgent = 'Edge';
      } else if (ua.includes('Chrome')) {
        userAgent = 'Chrome';
      } else if (ua.includes('Firefox/82')) {
        userAgent = 'Firefox Dev';
      } else if (ua.includes('Firefox') || ua.includes('KHTML')) {
        userAgent = 'Firefox';
      } else {
        userAgent = 'Unknown';
      }
      return userAgent;
    },
  },

  data: () => ({
    connectionMessage: 'Provide a name to Connect to the Server.',
    disconnectedFromServer: true,
    showEntryRoomCard: false,
    showDetails: false,
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
    // socket.io reserved events
    connect() {
      this.disconnectedFromServer = false;
      if (this.$socket.io.opts?.query) {
        const { visitor, id, nsp } = this.$socket.io.opts.query;
        this.log(
          `Server connected using Id: ${id}, Visitor: ${visitor}, and nsp ${nsp} `,
          'Visitor.vue'
        );
      }
    },

    //#region Other connection events
    disconnect(reason) {
      this.disconnectedFromServer = true;
      this.log(`Disconnect: ${reason}`, 'Visitor.vue');
    },
    error(reason) {
      this.log(`Error ${reason}`, 'Visitor.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'Visitor.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'Visitor.vue');
    },
    reconnect(reason) {
      this.log(`Recconnect ${reason}`, 'Visitor.vue');
    },
    reconnect_attempt(reason) {
      this.log(`Reconnect_attempt ${reason}`, 'Visitor.vue');
    },
    reconnecting(reason) {
      this.log(`Reconnecting ${reason}`, 'Visitor.vue');
    },
    reconnect_error(reason) {
      this.log(`Reconnect_error ${reason}`, 'Visitor.vue');
    },
    reconnect_failed(reason) {
      this.log(`Reconnect_failed ${reason}`, 'Visitor.vue');
    },
    // end socket.io reserved events

    message(msg) {
      this.log(msg);
    },
    //#endregion
    // end socket.io reserved events

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
    onWarned(data) {
      const { rooms, reason } = data;
      console.group(
        `[${getNow()}] EVENT: onWarned (Visitor.vue) - updating messages for ${
          this.enabled.visitor.visitor
        }'s visited Rooms:`
      );
      rooms.forEach((room) => {
        console.log(room.room);
        let msg = {
          visitor: this.enabled.visitor,
          room: room,
          message: 'Warned',
          sentTime: new Date().toISOString(),
        };
        this.messages = msg;
      });
      console.groupEnd();
      console.warn(`End of Visitor's responsibility.`);
      console.log(' ');
    },

    intersection(setA, setB) {
      let _intersection = new Set();
      for (let elem of setB) {
        if (setA.has(elem)) {
          _intersection.add(elem);
        }
      }
      return _intersection;
    },

    difference(setA, setB) {
      let _difference = new Set(setA);
      for (let elem of setB) {
        _difference.delete(elem);
      }
      return _difference;
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
          room: room.room,
          roomId: room.id,
          visitor: visitor.visitor,
          visitorId: visitor.id,
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
        room: this.enabled.room,
        message: checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

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
      this.enabled.room = selectedRoom;
      this.showEntryRoomCard = true;
      this.connectionMessage = null;
    },

    onReconnect() {
      connectToServer;
    },

    OnvVsitorReady(visitor) {
      // this.enabled holds two objects: room and visitor
      this.enabled.visitor = visitor;

      this.connectToServer();
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

    // TODO implement this or remove it
    removeVisitor() {
      // the server will remove this socket
      this.emit({ event: 'removeVisitor' });
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
      });
    },

    connectToServer() {
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != this.enabled.visitor?.id
      ) {
        this.$socket.disconnect();
      }
      this.$socket.io.opts.query = {
        visitor: this.enabled.visitor.visitor,
        id: this.enabled.visitor.id,
        nsp: this.enabled.visitor.nsp,
      };
      this.$socket.connect();
    },
  },
  //#endregion

  async created() {},

  async mounted() {
    await Room.$fetch();
    await State.$fetch();
    await Message.$fetch();
    this.connectToServer();
    this.exposeOpenRooms();
    // log the useragent in case we can't recognize it
    // this.log(navigator.userAgent);
    console.log('Visitor.vue mounted');
  },
};
</script>
