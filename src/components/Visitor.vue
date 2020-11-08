<template>
  <div>
    <systemBarTop>
      <v-col class="text-center">UA: {{ userAgent }}</v-col>
    </systemBarTop>

    <diaryCard />

    <v-row dense justify="space-between">
      <v-col cols="6"
        ><visitorIdentityCard @visitor="visitorReady($event)" />
      </v-col>
      <v-col v-show="$socket.connected">
        <!-- bput this back later 
                  :rooms="rooms" -->
        <roomIdentityCard
          :log="log"
          :enabled="enabled"
          @roomEntered="act($event)"
          @roomSelected="onRoomSelected($event)"
      /></v-col>
    </v-row>

    <connectionBanner
      v-if="$socket.disconnected"
      @reconnect="connectToServer"
    />
    <!--       v-if="enabled.canEnter === 1"
 -->
    <enterRoomBanner
      v-if="false"
      :selectedRoom="enabled.room"
      @enterRoom="onEnterRoom($event)"
    />

    <messageBanner :bgcolor="messageColor">
      {{ feedbackMessage }}</messageBanner
    >

    <exposureAlert v-if="alertMessage">{{ alertMessage }}</exposureAlert>

    <warnRoomCard :disabled="!messages.length" @warnRooms="warnRooms" />

    <dataTableCard :roomId="enabled.room.id" :log="log" />

    <systemBarBottom
      :socketMessage="socketMessage"
      :log="log"
    ></systemBarBottom>

    <auditTrailCard :cons="cons" />
  </div>
</template>
<script type="application/javascript" src="@/components/js/helpers.js"></script>

<script>
import helpers from '@/components/js/helpers.js';
const { printJson } = helpers;

import moment from 'moment';

import Message from '@/models/Message';
import Room from '@/models/Room';
import State from '@/models/State';
import systemBarTop from '@/components/cards/systemBarTop';
import diaryCard from '@/components/cards/visitor/diaryCard';
import visitorIdentityCard from '@/components/cards/visitor/visitorIdentityCard';
import roomIdentityCard from '@/components/cards/visitor/roomIdentityCard';
import connectionBanner from '@/components/cards/visitor/connectionBanner';
import enterRoomBanner from '@/components/cards/visitor/enterRoomBanner';
import messageBanner from '@/components/cards/visitor/messageBanner';
import exposureAlert from '@/components/cards/visitor/exposureAlert';
import warnRoomCard from '@/components/cards/visitor/warnRoomCard';
import systemBarBottom from '@/components/cards/systemBarBottom';
import dataTableCard from '@/components/cards/visitor/dataTableCard';
import auditTrailCard from '@/components/cards/visitor/auditTrailCard';

window.onerror = function(message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert('onerror: ' + message);
};
export default {
  name: 'LctVisitor',
  components: {
    systemBarTop,
    diaryCard,
    visitorIdentityCard,
    roomIdentityCard,
    connectionBanner,
    enterRoomBanner,
    messageBanner,
    exposureAlert,
    warnRoomCard,
    systemBarBottom,
    dataTableCard,
    auditTrailCard,
  },
  computed: {
    enterRoomEnabled() {
      let enableEntry = this.$socket.connected && this.enabled.canEnter;
      return enableEntry;
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
          room: newVal.room.room,
          visitor: newVal.visitor.id,
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
    feedbackMessage: 'Thanks for making us safer together...',
    messageColor: 'success lighten-1',
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
      if (this.$socket.io.opts?.query) {
        const { visitor, id, nsp } = this.$socket.io.opts.query;
        this.log(
          `Server connected using Id: ${id}, Visitor: ${visitor}, and nsp ${nsp} `,
          'Visitor.vue'
        );
        // this.exposeEventPromise(this.$socket, 'exposeAvailableRooms').then(
        //   (rooms) => {
        //     this.rooms = rooms;
        //     this.log(rooms);
        //   }
        // );
      }
    },
    disconnect(reason) {
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

    // end socket.io reserved events

    availableRoomsExposed(rooms) {
      this.log(`Visitor: ${rooms}`, 'Event: availableRoomsExposed');
    },
    openRoomsExposed(rooms) {
      this.log(
        `Visitor sees open Rooms: ${printJson(rooms)}`,
        'Event: openRoomsExposed'
      );
    },

    // Server fires this event when a Room opens/closes

    exposureAlert(alertMessage) {
      this.log(alertMessage, 'alert');
      this.alert = true;
      this.alertIcon = 'mdi-alert';
      this.messageColor = 'error';
      this.feedbackMessage = alertMessage;
    },

    updatedOccupancy(payload) {
      if (payload.room == this.enabled.room.id) {
        this.occupancy = payload.occupancy;
      }
      this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    },
  },

  methods: {
    onRoomSelected(selectedRoom) {
      this.enabled.room = selectedRoom;
      this.enabled.canEnter += 1;
    },

    enterRoom() {
      // disables the banner
      this.enabled.canEnter = -1;
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
          self.messageColor = 'success lighten-1';
          self.feedbackMessage = `Welcome to ${ACK.room.room}`;
        }
        this.log(ACK, 'ACKS');
      });
    },

    exposeEventPromise(clientSocket, event) {
      return new Promise(function(resolve) {
        clientSocket.emit(event, null, (results) => {
          resolve(results);
        });
      });
    },

    disconnectFromServer() {
      console.log('Disconnection from Server');
      this.$socket.disconnect(true); // passing true closes underlying connnection
    },

    refreshConnection(hard) {
      window.location.reload(hard);
    },

    groupBy(payload) {
      const { array, prop, val } = payload;
      return array.reduce(function(acc, obj) {
        acc.set(obj[prop], (acc.get(obj[prop]) || []).concat(obj[val]));
        return acc;
      }, new Map());
    },

    addYourId(val) {
      this.yourId = val;
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

    // Visitor groups all messages by Room.
    // Visitor iterates list sending an alertRoom event to socket.io server for each Room.
    // Alert payload contains all the dates for that Room.
    // Server relays message to each Room.
    warnRooms() {
      // Example warnings collection
      // [
      //   ['sentTime', '2020-10-27T19:05:53.082Z'],
      //   [
      //     'visitor',
      //     {
      //       visitor: 'AirGas Inc',
      //       id: 'JgvrILSxDwXRWJUpAAAC',
      //       nsp: 'enduringNet',
      //     },
      //   ],
      //   [
      //     'warnings',
      //     {
      //       d6QoVa_JZxnM_0BoAAAA: {
      //         room: 'Heathlands Medical',
      //         dates: ['2020-09-18', '2020-09-18', '2020-09-19'],
      //       },
      //       e1suC3Rdpj_1PuR3AAAB: {
      //         room: 'Heathlands Cafe',
      //         dates: ['2020-09-18', '2020-09-18', '2020-09-19'],
      //       },
      //     },
      //   ],
      // ];

      const payload = {
        array: this.messages.filter(
          (v) => v.visitor == this.enabled.visitor.id
        ),
        prop: 'room',
        val: 'sentTime',
      };
      const msg = {
        sentTime: new Date().toISOString(),
        visitor: this.enabled.visitor.visitor,
        warnings: this.groupMessagesByRoomAndDate(payload),
      };
      this.log(msg, 'exposureWarning');
      this.emit({
        event: 'exposureWarning',
        message: msg,
        ack: (ack) => {
          this.alert = true;
          this.alertIcon = 'mdi-alert';
          this.messageColor = 'warning';
          this.feedbackMessage = ack.result.flat();
          console.log('exposureWarning result:', ack.result);
        },
      });
    },

    getEnteredMessages(room, v) {
      return v.room == room && v.message.toLowerCase() == 'entered';
    },

    // used when sending individual Room warnings to Server (not currently used)
    // emit the exposureWarning to each Room occupied by Visitor
    emitExposureWarning(v) {
      this.log(
        `Warned ${v.room} of exposure on ${moment(v.sentTime).format('llll')}`
      );
      this.emit({
        event: 'exposureWarning',
        message: {
          room: v.room,
          message: v.sentTime,
          sentTime: v.sentTime,
        },
        ack: (ack) => {
          this.alert = true;
          this.alertIcon = 'mdi-alert';
          this.messageColor = 'warning';
          this.feedbackMessage = ack.result.flat();
          console.log('exposureWarning result:', ack.result);
        },
      });
    },

    emit(payload) {
      if (!this.$socket.id) {
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    act(roomId = this.enabled.room.id) {
      let msg = {
        visitor: this.enabled.visitor,
        room: this.enabled.room,
        message: this.checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.checkedOut ? 'enterRoom' : 'leaveRoom';

      this.emit({
        event: event,
        message: msg,
        ack: (ack) => {
          this.log(ack.message);
        },
      });
      this.checkedOut = !this.checkedOut;
      let m = this.checkedOut ? 'out of' : 'into';
      this.log(`You checked ${m}  ${roomId}`);
    },

    // helper methods
    log(msg, type = 'information') {
      this.cons.push({
        sentTime: moment(),
        type: type,
        message: msg,
      });
    },

    getRandomIntBetween(min, max) {
      // return Math.floor(Math.random() * Math.floor(max))-1;
      return Math.random() * (max - min) + min;
    },

    // handleMessage(msg) {
    //   this.messages = msg;
    //   if (msg.message == 'Alert') {
    //     let alertMsg = `A fellow visitor to ${msg.room} is in quarantine at ${msg.sentTime}`;
    //     alert(`handleMessage:`, alertMsg);
    //   }
    // },

    removeVisitor() {
      // the server will remove this socket
      this.emit({ event: 'removeVisitor' });
    },

    deleteMessage(id) {
      let m = `Deleting message ${id}`;
      this.log(m);
      Message.delete(id);
    },

    deleteAllMessages() {
      this.log(`Deleting all messages`);
      Message.deleteAll();
      this.refreshConnection(true);
    },

    testSocket(event) {
      // this.$socket.emit(event, 'data');
      this.pingServer(event);
    },

    pingServer() {
      // Send the "pingServer" event to the server.
      this.log(`Using socket ${this.$socket.id}...`);
      this.$socket.emit('pingServer', this.enabled.room.id, (ack) =>
        this.log('...' + ack)
      );
      // this.log('pinging server');
      // this.$socket.emit('ping');
    },

    changeRoom() {
      this.changingRoom = 0;
      if (this.oldRoomId) {
        this.checkedOut = false;
        // will act on roomId. which one?
        this.act(this.oldRoomId);
      }
      this.checkedOut = true;
      this.act();
    },
    doNotChangeRoom() {
      // this.checkedOut = !this.checkedOut;
      this.roomId = this.oldRoomId || this.roomId;
      this.changingRoom = -1;
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

    visitorReady(visitor) {
      // enabled holds two objects: room and visitor
      this.enabled.visitor = visitor;
      this.enabled.canEnter += 1;
      this.connectToServer();
    },
    onEnterRoom(proceed) {
      this.enabled.canEnter = -1;
      if (proceed) {
        this.enterRoom();
      }
    },
  },

  // watch: {

  //   roomId(newRoomId, oldRoomId) {
  //     if (this.changingRoom === -1) {
  //       this.changingRoom = 0;
  //       return;
  //     }
  //     this.oldRoomId = oldRoomId;
  //     if (newRoomId || oldRoomId) {
  //       this.changingRoom = 1;
  //     }
  //   },
  // },
  async created() {},

  async mounted() {
    await Room.$fetch();
    await State.$fetch();
    await Message.$fetch();

    // log the useragent in case we can't recognize it
    // this.log(navigator.userAgent);
    console.log('Visitor.vue mounted');
  },
};
</script>
