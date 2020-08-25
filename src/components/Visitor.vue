<template>
  <v-container>
    <v-card dark>
      <v-card-title>Your Travel Diary</v-card-title>
      <v-card-subtitle
        >Lag each Room you visit. If you go into quarantine, Alert
        Rooms</v-card-subtitle
      >
      <v-card-text>
        <v-row dense>
          <v-col cols="4">
            <v-combobox
              v-model="yourId"
              :items="names"
              label="Your ID"
              hint="Make this unique and pseudonymous"
            ></v-combobox>
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="roomId"
              :items="rooms"
              label="Visit Room"
            ></v-select>
          </v-col>
          <v-col cols="3">
            <v-btn
              :color="checkedOut ? 'success' : 'warning'"
              fab
              dark
              @click="check"
            >
              <v-icon>{{ btnType }}</v-icon>
            </v-btn>
            <span class="pl-3">{{
              checkedOut ? 'Check-in' : 'Check-out'
            }}</span>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-btn color="error" block dark @click="warnRooms">
            Alert
            <v-icon>mdi-alert</v-icon> Rooms
          </v-btn>
        </v-card-actions>
      </v-card-text>
      <v-card-text>
        <v-list dense>
          <v-row align="center" dense>
            <v-col>
              <span
                >{{ daysBack == 0 ? 'Today' : 'All' }} {{ entered }} visits
              </span></v-col
            >
            <v-col cols="6">
              <v-checkbox
                :value="allVisits"
                label="See all visits"
                @change="toggleVisits"
              ></v-checkbox
            ></v-col>
          </v-row>
          <v-data-table
            :headers="messageHeaders"
            :items="visits"
            multi-sort
            item-key="id"
            dense
            :items-per-page="5"
            class="elevation-1"
          >
            <template v-slot:item.sentTime="{ item }">
              {{ visitedDate(item.sentTime) }}
            </template>
            <template v-slot:item.action="{ item }">
              <v-icon @click="deleteMessage(item.id)">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-list>
      </v-card-text>
    </v-card>
    <v-system-bar color="secondary">
      <v-icon small>mdi-transit-connection-variant </v-icon>
      <span>Server:{{ socketUrl }}</span>
      <v-spacer></v-spacer>
      <span>Socket: {{ socketInfo }}{{ socketId }}</span>
      <v-spacer></v-spacer>
      <span>Room Manager: {{ managedRoom }}</span>
      <v-spacer></v-spacer>
      <v-btn small text @click="test">Test</v-btn>
    </v-system-bar>
    <v-card>
      <v-card-title>Audit Trail</v-card-title>
      <v-data-table
        :headers="logHeaders"
        :items="cons"
        multi-sort
        item-key="id"
        dense
        :items-per-page="5"
        class="elevation-1"
      >
        <template v-slot:item.sentTime="{ item }">
          {{ visitedDate(item.sentTime) }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import config from '@/config.json';
import moment from 'moment';

import io from 'socket.io-client';
let socket;
connect();

function connect() {
  socket = io(config.socketUrl);
}

// socket.on('alert', (msg) => {
//   alert('alert', msg);
// });
socket.on('exposureAlert', (msg) => {
  alert(msg);
});

import Message from '@/models/Message';
import Name from '@/models/Name';
import Room from '@/models/Room';
import State from '@/models/State';

export default {
  name: 'LctVisitor',
  computed: {
    socketInfo() {
      return socket.id;
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

    yourId: {
      get() {
        return this.state?.yourId;
      },
      set(newVal) {
        // static changeYourId function on State model
        State.changeYourId(newVal);
        // static update function on Name model
        Name.update(newVal).catch((e) => console.log(e));
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

    rooms() {
      return Room.all().map((v) => v.roomId);
    },

    names() {
      return Name.all().map((v) => v.yourId);
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
    cons: [],
    daysBack: 0,
    socketServerOnline: false,
    dataUrl: config.dataUrl,
    socketUrl: config.socketUrl,
    // socketUrl: config.ngrokUrl,
    visitFormat: 'HH:mm on ddd, MMM DD',
    checkedOut: true,
    socketId: '',
    messageHeaders: [
      { text: 'ID', value: 'id' },
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Delete', value: 'action' },
    ],
    logHeaders: [
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
    ],
  }),

  methods: {
    emit(payload) {
      if (!socket.connected) {
        if (!confirm('Your socket is disconnected. Reconnect now? ')) {
          return;
        }
        connect();
      }
      console.log('payload :>> ', payload);
      this.cons.push({
        sentTime: new Date(),
        message: `payload: ${JSON.stringify(payload)}`,
      }),
        socket.emit(payload.event, payload.message, payload.ack);
    },

    test() {
      this.daysBack = 14;
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Entered',
        sentTime: moment()
          .add(-this.getRandomInt(3), 'day')
          .toISOString(),
      };
      // cache the message
      this.messages = msg;
      console.log(this.messages);
      let m = `Messages (including test): ${this.messages}`;
      this.cons.push({ sentTime: new Date(), message: m }),
        this.emit({
          event: 'enterRoom',
          message: msg,
        });
    },

    check() {
      let cons = this.cons;
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: this.checkedOut ? 'Entered' : 'Departed',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.checkedOut ? 'enterRoom' : 'leaveRoom';
      // socket.emit(event, msg, function(ack) {
      //   cons.push({
      //     sentTime: new Date(),
      //     message: ack,
      //   });
      // });
      this.emit({
        event: event,
        message: msg,
        ack: function(ack) {
          cons.push({
            sentTime: new Date(),
            message: ack,
          });
        },
      });

      this.checkedOut = !this.checkedOut;
      if (this.checkedOut) {
        this.cons.push({
          sentTime: new Date(),
          message: `You checked out of ${this.roomId}`,
        });
      }
    },

    // Visitor groups all messages by Room.
    // Visitor iterates list sending an alertRoom event to socket.io server for each Room.
    // Alert payload contains all the dates for that Room.
    // Server relays message to each Room.
    warnRooms() {
      console.log(this.visits);
      let roomSet = new Set(this.messages.map((v) => v.room));
      roomSet.forEach((room) => {
        try {
          let visits = this.messages.filter(
            (v) => v.room == room && v.message.toLowerCase() == 'entered'
          );
          console.log('room :>> ', room);
          console.log('visits :>> ', visits);
          if (visits.length) {
            this.emit({
              event: 'exposureWarning',
              message: {
                room: room,
                message: visits, // an array of dates
                sentTime: new Date().toISOString(),
              },
              ack: function(ack) {
                alert(ack);
              },
            });
          } else {
            alert(`${room} has no visits among its messages.`);
          }
          // get array of dates for this room
          // room.visits = this.messages.map((v) => {
          //   console.log('v.room,v.message :>> ', v.room, v.message);
          //   if (v.room == room && v.message.toLowerCase() == 'entered') {
          //     return v.sentTime;
          //   }
          // });
        } catch (error) {
          console.log('error :>> ', error);
        }
      });

      // socket.emit(
      //   'warnRooms',
      //   {
      //     visitor: this.yourId,
      //     room: '',
      //     message: visits,
      //     sentTime: new Date().toISOString(),
      //   },
      //   function(msg) {
      //     alert('Server acknowledges your Room Alerts:', msg);
      //   }
    },

    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
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
      console.log('deleting', id);
      let m = `Deleting: ${id}`;
      this.cons.push({ sentTime: new Date(), message: m });
      if (this.daysBack == 0) {
        socket.disconnect();
        Message.delete(id);
        alert(
          socket.connected
            ? 'Socket still connected'
            : 'Your socket disconnected. Refesh to reconnect and to continue to receive messages.'
        );
      } else {
        this.emit({ event: 'disconnectAll' });
        alert('All sockets disconnected. Refesh to reconnect this socket.');
        Message.deleteAll();
      }
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

    toggleVisits() {
      let cons = this.cons;
      this.daysBack = !this.daysBack ? 14 : 0;
      if (this.daysBack != 0) {
        this.emit({
          event: 'listAllSockets',
          message: null,
          ack: function(ack) {
            cons.push({ sentTime: new Date(), message: ack });
          },
        });
      }
    },
  },

  watch: {
    roomId() {
      if (!this.checkedOut) {
        if (confirm('Should i check you out of', this.roomId, '?')) {
          let cons = this.cons;
          this.checkedOut = !this.checkedOut;
          this.emit({
            event: 'leaveRoom',
            message: this.yourId,
            ack: function(ack) {
              let m = `Checked out of: ${ack}`;
              cons.push({ sentTime: new Date(), message: m });
            },
          });
        }
      }
    },
  },
  async created() {},

  async mounted() {
    // so we can reference this, as necessary

    let self = this;
    let cons = this.cons;
    socket.on('message', function(msg) {
      cons.push({ sentTime: new Date(), message: msg });
    });

    // socket.on('enterRoom', (roomId) => {
    //   console.log('Entered Room', roomId);
    //   this.cons.push(`Entered Room: ${roomId}`);
    // });
    socket.on('connect', function() {
      self.socketId = socket.id;
    });
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
