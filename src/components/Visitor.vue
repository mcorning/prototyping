<template>
  <v-container>
    <systemBarTop>
      <v-col class="text-center">UA: {{ userAgent }}</v-col>
    </systemBarTop>

    <diaryCard />
    <v-row dense justify="space-between">
      <v-col
        ><visitorIdentityCard
          :socket="$socket"
          @visitor="visitorReady($event)"
        />
      </v-col>
      <v-col v-if="firstTime"><firstTimeCard /></v-col>
      <v-col
        ><roomIdentityCard
          :rooms="rooms"
          :roomIsReadyToEnter="roomIsReadyToEnter"
          :btnType="btnType"
          :checkedOut="checkedOut"
      /></v-col>
    </v-row>
    <connectionBanner v-if="$socket.disconnected" />
    <enterRoomBanner v-if="changingRoom === true" :roomId="roomId" />
    <exposureAlert />
    <warnRoomCard :disabled="!messages.length" />

    <dataTableCard
      :daysBack="daysBack"
      :entered="entered"
      :allVisits="allVisits"
      :messages="messages"
      :visits="visits"
    />

    <systemBarBottom />

    <auditTrailCard :cons="cons" />
  </v-container>
</template>
<script type="application/javascript" src="@/components/js/helpers.js"></script>

<script>
import moment from 'moment';

import Message from '@/models/Message';
import Room from '@/models/Room';
import State from '@/models/State';
import systemBarTop from '@/components/cards/visitor/systemBarTop';
import diaryCard from '@/components/cards/visitor/diaryCard';
import visitorIdentityCard from '@/components/cards/visitor/visitorIdentityCard';
import firstTimeCard from '@/components/cards/visitor/firstTimeCard';
import roomIdentityCard from '@/components/cards/visitor/roomIdentityCard';
import connectionBanner from '@/components/cards/visitor/connectionBanner';
import enterRoomBanner from '@/components/cards/visitor/enterRoomBanner';
import exposureAlert from '@/components/cards/visitor/exposureAlert';
import warnRoomCard from '@/components/cards/visitor/warnRoomCard';
import systemBarBottom from '@/components/cards/visitor/systemBarBottom';
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
    firstTimeCard,
    roomIdentityCard,
    connectionBanner,
    enterRoomBanner,
    exposureAlert,
    warnRoomCard,
    systemBarBottom,
    dataTableCard,
    auditTrailCard,
  },
  computed: {
    visitorData() {
      return {
        visitors: this.visitors,
        checkedOut: this.checkedOut,
        btnType: this.btnType,
      };
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

    exposureWarning() {
      if (!this.messages.length) return {};
      let payload = {
        array: this.messages,
        prop: 'room',
        val: 'sentTime',
      };
      return this.groupBy(payload);
    },

    firstTime() {
      return false; //!this.visitors.length;
    },

    roomIsReadyToEnter() {
      return this.rooms.includes(this.roomId) && this.yourId;
    },

    allVisits() {
      return this.daysBack != 0;
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

    roomId: {
      get() {
        return this.state?.roomId;
      },
      set(newVal) {
        // static changeRoomId function on State model
        State.changeRoomId(newVal);
        // static update function on Room model
        Room.update(newVal).catch((e) => console.log(e));
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

    visits() {
      let allVisits = this.messages.filter((v) => this.isBetween(v.sentTime));
      if (this.daysBack == 0) {
        return allVisits.filter((v) => this.roomId == v.room);
      }
      return allVisits;
    },
    entered() {
      return this.visits.filter((v) => v.message == 'Entered').length;
    },
    departed() {
      return this.visits.filter((v) => v.message == 'Departed').length;
    },
    btnType() {
      return this.checkedOut ? 'mdi-account-plus' : 'mdi-account-minus';
    },
  },

  data: () => ({
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
    enabled: { visitor: {}, room: {} },

    // isConnected: false,
    cons: [],
    rooms: [],
    daysBack: 0,
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
          `...Server connected using Id:${id}, Visitor: ${visitor}, and nsp ${nsp} `
        );
        this.exposeEventPromise(this.$socket, 'exposeAvailableRooms').then(
          (rooms) => (this.rooms = rooms)
        );
      }
    },
    disconnect() {
      this.log('Disconnected from Server');
    },

    message(msg) {
      this.log(msg);
    },

    // end socket.io reserved events
    // Server fires this event when a Room opens/closes
    availableRoomsExposed(rooms) {
      Room.$deleteAll();
      console.assert(
        this.rooms.length == 0,
        'Should have no rooms before update'
      );
      rooms.forEach((room) => {
        Room.update(room.name);
      });
    },

    exposureAlert(alertMessage) {
      this.log(alertMessage, 'alert');
      this.alert = true;
      this.alertIcon = 'mdi-alert';
      this.alertColor = 'error';
      this.alertMessage = alertMessage;
    },

    updatedOccupancy(payload) {
      if (payload.room == this.roomId) {
        this.occupancy = payload.occupancy;
      }
      this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    },
  },

  methods: {
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

    // this is a (more?) functional way to do grouping
    groupByFn(arr, fn) {
      return arr
        .map(typeof fn === 'function' ? fn : (val) => val[fn])
        .reduce((acc, val, i) => {
          acc[val] = (acc[val] || []).concat(arr[i]);
          return acc;
        }, {});
    },

    groupBy(payload) {
      const { array, prop, val } = payload;

      return array.reduce(function(acc, obj) {
        let key = obj[prop];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj[val]);
        return acc;
      }, {});
    },

    addYourId(val) {
      this.yourId = val;
    },

    // Visitor groups all messages by Room.
    // Visitor iterates list sending an alertRoom event to socket.io server for each Room.
    // Alert payload contains all the dates for that Room.
    // Server relays message to each Room.
    warnRooms() {
      // // reset, if necessary, alert so we can hit the warn rooms more than once, if necessary.

      //testing late alerts
      this.alert = false;

      // returns something like this:
      // WARNING MESSAGE STRUCT:
      //{
      //   sentTime: '2020-09-19T00:56:54.570Z',
      //   visitor: {
      //     visior: 'Nurse Jackie',
      //     id: 'FWzLl5dS9sr9FxDsAAAB',
      //     nsp: 'enduringNet',
      //   },
      //   warning: {              // ONE ROOM PER WARNING
      //     room: {
      //       room: 'Heathlands Medical',
      //       id: 'd6QoVa_JZxnM_0BoAAAA',
      //       nsp: 'enduringNet',
      //     },
      //     dates: [
      //       '2020-09-19T00:33:04.248Z',  // WARNING CAN
      //       '2020-09-14T02:53:33.738Z',  // HAVE MULTIPLE
      //       '2020-09-18T07:15:00.00Z',   // VISIT DATES
      //     ],
      //   },
      // };

      console.table(this.exposureWarning);
      this.log(
        `Warning: ${Object.entries(this.exposureWarning)
          .toString()
          .split(',')
          .join(', ')}`,
        'alert'
      );

      this.emit({
        event: 'exposureWarning',
        message: {
          visitor: this.yourId,
          warning: this.exposureWarning,
          sentTime: new Date().toISOString(),
        },
        ack: (ack) => {
          this.alert = true;
          this.alertIcon = 'mdi-alert';
          this.alertColor = 'warning';
          this.alertMessage = ack;
        },
      });
    },

    getEnteredMessages(room, v) {
      return v.room == room && v.message.toLowerCase() == 'entered';
    },

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
          this.alertColor = 'warning';
          this.alertMessage = ack;
        },
      });
    },

    emit(payload) {
      if (!this.$socket.id) {
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    act(roomId = this.roomId) {
      let msg = {
        visitor: this.yourId,
        room: roomId,
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

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
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

    isBetween(date) {
      let visit = moment(date);

      let past = moment()
        .add(-this.daysBack, 'day')
        .format('YYYY-MM-DD');
      let tomorrow = moment()
        .add(1, 'day')
        .format('YYYY-MM-DD');
      let test = visit.isBetween(past, tomorrow);
      return test;
    },

    testSocket(event) {
      // this.$socket.emit(event, 'data');
      this.pingServer(event);
    },

    pingServer() {
      // Send the "pingServer" event to the server.
      // this.log(`this.isConnected: ${this.isConnected}`);
      this.log(`Using socket ${this.$socket.id}...`);
      this.$socket.emit('pingServer', this.roomId, (ack) =>
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
      this.log('Connecting to Server...');
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != this.enabled.visitor?.id
      ) {
        this.$socket.disconnect();
      }
      // this is async, so let the connect() function set the isConnected property
      this.$socket.io.opts.query = {
        visitor: this.enabled.visitor.visitor,
        id: this.enabled.visitor.id,
        nsp: this.enabled.visitor.nsp,
      };
      this.$socket.connect();
    },

    visitorReady(visitor) {
      this.enabled.visitor = visitor;
      this.connectToServer();
    },
  },

  watch: {
    enabled() {
      if (enabled.visitor && enabled.room) {
        this.enterRoom();
      }
    },
    roomId(newRoomId, oldRoomId) {
      if (this.changingRoom === -1) {
        this.changingRoom = 0;
        return;
      }
      this.oldRoomId = oldRoomId;
      if (newRoomId || oldRoomId) {
        this.changingRoom = 1;
      }
    },
  },
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
