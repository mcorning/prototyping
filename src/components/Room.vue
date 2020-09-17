<template>
  <v-container>
    <v-system-bar color="secondary">
      <v-row>
        <v-col v-if="hasRoomManager">
          <!-- <span class="small">Room Manager: {{ managedRoom }}</span>
      <v-spacer></v-spacer>
      <v-checkbox v-model="hasRoomManager" label="RM" small>
        {{ hasRoomManager }}</v-checkbox
          >-->
        </v-col>
        <v-col>IO:{{ $socket.io.uri }}</v-col>
        <v-col class="text-right">{{ $build }}</v-col>
      </v-row>
    </v-system-bar>
    <v-card>
      <v-card-title>Room Control</v-card-title>
      <v-card-subtitle>Monitor Visitors and alert them as necessary</v-card-subtitle>

      <v-card-text class="pb-0">
        <v-row>
          <v-col cols="6" class="col-md-3">
            <v-combobox
              v-model="roomId"
              @change="changeRoom"
              :items="rooms"
              label="Public place: Building.Room"
              clearable
              placeholder="Example: CareCenter.Lobby"
              :rules="[rules.counter, rules.nameDelimiter]"
            ></v-combobox>
          </v-col>
          <v-col class="col-md-4 pl-10">
            <div v-if="roomId" class="text-center">
              <v-btn :color="closed ? 'success' : 'warning'" fab dark @click="act">
                <v-icon>{{ btnType }}</v-icon>
              </v-btn>
              <span class="pl-3">
                {{
                closed ? 'Open Room' : 'Close Room'
                }}
              </span>
            </div>
            <v-card v-else>
              <v-card-title>First Time?</v-card-title>
              <v-card-text>Enter your two-part Room name (e.g., Building.Room).</v-card-text>
              <v-card-text>
                You can manage more than one Room, but you can only open one
                Room at a time. You can delete an entry with the X
                button.
              </v-card-text>
              <v-card-text>
                When you open a Room, the Server adds your Room to Visitor
                pages so they can enter.
              </v-card-text>
            </v-card>
          </v-col>

          <!-- <v-col cols="5" class="col-md-5">
            <v-card>
              <v-card-text>
                Rooms are easy to get ready.
                <ol>
                  <li>Choose a room</li>
                  <li>Click the Open Room button.</li>
                </ol>
                Then watch as people checkin...
                <p class="pb-0">Visitor exposure alerts are automatic.</p>
              </v-card-text>
            </v-card>
          </v-col>-->

          <v-alert
            :value="alert"
            dark
            dismissible
            border="left"
            :color="alertColor"
            elevation="2"
            colored-border
            :icon="alertIcon"
            transition="scale-transition"
          >
            <span color="gray">{{ alertMessage }}</span>
          </v-alert>
          <!-- <v-dialog v-model="dialog" persistent max-width="290">
            <v-card>
              <v-card-title class="headline">Room Management</v-card-title>
              <v-card-text
                >Are you sure you want to delete {{ roomId }}?</v-card-text
              >
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="deleteRoom"
                  >Yes</v-btn
                >
                <v-btn color="green darken-1" text @click="dialog = false"
                  >No</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>-->
          <v-col cols="6" v-if="hasRoomManager">
            <v-text-field label="Room Manager ID" v-model="managedRoom"></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-row dense>
        <v-col cols="12">
          <v-card-text class="pb-0">
            <v-subheader>
              <v-row align="center" justify="space-between">
                <v-col cols="auto">
                  <span>
                    Today's Visitor Log - {{ entered }} visits [{{
                    uniqueVisitorNames.length
                    }}
                    unique visitor(s)]
                  </span>
                </v-col>
                <v-col>
                  <v-checkbox :value="seeAllVisits" label="See all visits" @change="toggleVisits"></v-checkbox>
                </v-col>
              </v-row>
            </v-subheader>
            <v-data-table
              :headers="messageHeaders"
              :items="visits"
              item-key="id"
              dense
              class="elevation-1"
            >
              <template v-slot:item.sentTime="{ item }">{{ visitedDate(item.sentTime) }}</template>
              <template v-slot:item.action="{ item }">
                <v-icon @click="deleteMessage(item.id)">mdi-delete</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-col>
        <v-col cols="6">
          <v-card-text v-if="listUniqueVisitors">
            <v-subheader>Unique Visitors Today</v-subheader>

            <v-list dense max-height="2" height="2">
              <v-list-item-group v-model="uniqueVisitorNames" color="primary">
                <v-list-item v-for="(visitor, i) in uniqueVisitorNames" :key="i">
                  <v-list-item-content>
                    <v-list-item-title v-text="visitor"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-col>
      </v-row>

      <v-card-text v-if="alerts.length">
        <v-data-table
          :headers="alertHeaders"
          :items="alerts"
          item-key="id"
          dense
          class="elevation-1"
        >
          <template v-slot:item.sentTime="{ item }">{{ visitedDate(item.sentTime) }}</template>
        </v-data-table>
      </v-card-text>
      <!-- <v-card-actions>
        
        <span class="pr-3">Alert Room's Visitors </span>
        <v-btn color="error" fab dark>
          <v-icon x-large>mdi-alert</v-icon>
        </v-btn>
      </v-card-actions>-->
    </v-card>
    <v-system-bar color="secondary">
      <!-- <v-icon small>mdi-transit-connection-variant </v-icon> -->
      <v-row align="center">
        <v-col cols="10">Socket: {{ $socket.id }}</v-col>
        <v-col cols="2" class="text-right">
          <v-btn @click="testSocket" text>
            <v-icon>mdi-check-network-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
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
        <template v-slot:item.sentTime="{ item }">{{ visitedDate(item.sentTime) }}</template>
      </v-data-table>
      <div class="text-center">
        How are we doing on the Room experience?
        <v-rating v-model="rating" background-color="primary lighten-3" color="primary" large></v-rating>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import moment from "moment";

import Message from "@/models/Message";
import Name from "@/models/Name";
import Room from "@/models/Room";
import State from "@/models/State";

window.onerror = function (message, url, lineNo, columnNo, error) {
  /// what you want to do with error here
  console.log(error.stack);
  alert("onerror: " + message);
};

export default {
  name: "LctRoom",
  components: {},
  computed: {
    roomisEmpty() {
      return !this.rooms.length;
    },

    state: {
      get() {
        let s = State.query().first();
        return s;
      },
      set(newVal) {
        this.log(`State gets${newVal}, but we don't use it...odd.`);
      },
    },

    rooms() {
      return Room.all().map((v) => v.roomId);
    },
    roomId: {
      get() {
        // state will be null at first
        // but second call should have value.
        // somewhere, when rooms is empty, '
        // the system wants to return the string 'null'
        // and we want an empty string
        // so it is written
        // so it shall be done
        let roomId = this.state?.roomId;
        if (roomId) {
          // roomId isn't yet available to methods, so pass the arg here explicitly
          this.openMyRoom(roomId);
        }
        return roomId;
      },
      set(newVal) {
        // if we have a newVal, use it
        if (newVal) {
          // static update function on Room model
          Room.update(newVal).catch((e) => console.log(e));
          this.openMyRoom(newVal);
        }
        // else delete the last used roomId (then delete the roomId in state)
        else {
          Room.delete(this.roomId).then((r) => console.log("rooms", r));
        }
        // change the roomId after we don't need the old value
        // (e.g., when deleting a Room from IndexDB)
        // static changeRoomId function on State model
        State.changeRoomId(newVal);
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

    seeAllVisits() {
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

    visits() {
      if (!this.messages.length) {
        return [];
      }

      if (this.daysBack == 0) {
        // limit visits to those of the current Room (previous vues may have used different Rooms)
        let roomVisits = this.messages.filter((v) => {
          return this.roomId == v.room && this.isToday(v.sentTime);
        });
        return roomVisits;
      }
      return this.messages;
    },

    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
    btnType() {
      return this.closed ? "mdi-door-open" : "mdi-door-closed-lock";
    },
  },

  data: () => ({
    rating: 3,
    deleting: false,
    dialog: false,
    alert: false,
    alertColor: "error",
    alertMessage: "",
    alertIcon: "mdi-alert",

    isConnected: false,
    cons: [],
    socketId: "",
    occupancy: 0,
    socketUri: "",
    hasRoomManager: false,
    daysBack: 0,
    today: "YYYY-MM-DD",
    closed: true,

    listUniqueVisitors: false,
    visitFormat: "HH:mm on ddd, MMM DD",
    messageHeaders: [
      { text: "Visitor", value: "visitor" },
      { text: "Message", value: "message" },
      { text: "Sent  ", value: "sentTime" },
      { text: "Room", value: "room" },
      { text: "Delete", value: "action" },
    ],
    logHeaders: [
      { text: "Message", value: "message" },
      { text: "Sent  ", value: "sentTime" },
    ],
    alertHeaders: [
      { text: "Date of Alert", value: "sentTime" },
      { text: "Visitor", value: "visitor" },
    ],
    alerts: [],
    yourId: "",

    // Vuetify provides validation
    rules: {
      required: (value) => !!value || "Required.",
      counter: (value) => {
        if (!value) {
          return false;
        }
        value?.length <= 20 || "Max 20 characters";
      },
      nameDelimiter: (value) => {
        if (!value) {
          return false;
        }
        value.includes(".");
      },
      email: (value) => {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(value) || "Invalid e-mail.";
      },
    },
  }),

  sockets: {
    // socket.io reserved events
    connect() {
      this.socketId = this.$socket.id;

      this.log(`Server connected on socket ${this.socketId}`);
    },

    disconnect() {
      this.log(
        "The server disconnected your socket (probably because you refreshed the browser)."
      );
    },
    // end socket.io reserved events

    // Visitor routine events
    checkIn(msg) {
      this.messages = msg;
    },

    checkOut(msg) {
      this.messages = msg;
    },
    //

    // Room event handlers

    // end socket.io reserved events

    updatedOccupancy(payload) {
      if (payload.room == this.roomId) {
        this.occupancy = payload.occupancy;
      }
      this.log(`${payload.room} occupancy is now ${payload.occupancy}`);
    },

    // Visitor iterates their messages taking one Room visit (viz., Room name and visit date) at a time.
    // The Room receives the Visitor's visit date
    notifyRoom(payload, ack) {
      // reset alert in case close button was pushed
      this.alert = false;
      const { exposureDate, room } = payload;
      // exposureDate is local ISO string
      let visitedKey = moment(exposureDate).format("YYYYMMDD");
      console.log(
        "Visit exposureDate (visitKey):",
        exposureDate,
        `${visitedKey}`
      );
      console.log("All Messages");
      console.table(this.messages);
      console.log();

      let entries = this.messages.reduce((accumulator, currentValue) => {
        if (
          currentValue.room == room &&
          currentValue.message.toLowerCase() == "entered"
        ) {
          accumulator.push({
            visitor: currentValue.visitor,
            sentTime: currentValue.sentTime,
          });
        }
        return accumulator;
      }, []);

      console.log(`Visitor Entries to ${room}`);
      console.table(entries);
      console.log();

      let exposures = entries.filter((visit) => {
        let visitKey = moment(visit.sentTime).format("YYYYMMDD");
        console.log(visitKey);
        return visitKey == visitedKey;
      });
      console.log("Exposed Visitors:");
      console.table(exposures);
      console.log();

      // now map over visitors for this exposureDate, and emit alertVisitor for each exposed visit
      let notified = exposures.map((exposed) => {
        let msg = `${exposed.visitor}, BE ADVISED: on ${moment(
          exposureDate
        ).format(
          "llll"
        )}, you may have been exposed to Covid. Self quarantine.`;
        this.emit({
          event: "alertVisitor",
          message: {
            visitor: exposed.visitor,
            message: msg,
            sentTime: new Date().toISOString(),
          },
          ack: (ack) => {
            this.log(ack);
          },
        });
      });
      if (ack) ack("alert sent");

      this.alertMessage = notified.length
        ? `Visitor warning triggered Exposure Alert to ${notified.length} visitors to ${room} after ${exposureDate}`
        : `Exposure Alert does not apply: No other visitor(s) to ${room} after ${exposureDate}`;
      this.alertColor = "warning";
      this.alertIcon = "mdi-home-alert";
      this.alert = true;
    },
  },

  methods: {
    // main methods
    openMyRoom(yourID) {
      let payload = {
        event: "openMyRoom",
        message: yourID,
        ack: (ack) => {
          this.log(ack);
          this.alertColor = "success";
          this.alertMessage = ack;
          this.alertIcon = "mdi-email-open";
          this.alert = true;
        },
      };
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    changeRoom(val) {
      let msg;
      if (!val || this.rooms.length > 1) {
        msg = {
          room: this.roomId,
          message: val ? "Closed" : "Deleted",
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: "closeRoom",
          message: msg,
          ack: (ack) => {
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = val ? "success" : "warning";
            this.alert = true;
            this.log(`Closed Room ${this.roomId}`);
          },
        });
      }
      if (val && this.rooms.length) {
        msg = {
          room: this.roomId,
          message: "Opened",
          sentTime: new Date().toISOString(),
        };
        this.emit({
          event: "openRoom",
          message: msg,
          ack: (ack) => {
            this.closed = ack.error.length;
            let msg = `${ack.message}  ${ack.error}`;
            this.alertMessage = msg;
            this.alertColor = "success";
            this.alert = true;
            this.log("Opened Room");
          },
        });
      }
    },

    reset() {
      this.deleting = false;
    },

    connectToServer() {
      this.log("Connecting to Server...");
      this.$socket.connect();
    },

    emit(payload) {
      if (!this.$socket.id) {
        // this.dialog = true;
        alert("No socket. Attempting to reopen.");
        return;
      }
      let msg =
        `Emitting ${payload.event}` +
        (payload.message.visitor
          ? ` to server for ${payload.message.visitor}`
          : "");
      this.log(msg);
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    act() {
      let msg = {
        room: this.roomId,
        message: this.closed ? "Opened" : "Closed",
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;

      let event = this.closed ? "openRoom" : "closeRoom";
      this.emit({
        event: event,
        message: msg,
        ack: (ack) => {
          this.alertColor = "success";
          this.alertMessage = ack.message;
          this.alert = true;
        },
      });
      this.closed = !this.closed;
    },

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },
    // end main methods

    // helper methods
    log(msg) {
      this.cons.push({
        sentTime: moment(),
        message: msg,
      });
    },

    testSocket(event) {
      // this.$socket.emit(event, 'data');
      this.pingServer(event);
    },

    pingServer() {
      this.log(`Using socket ${this.$socket.id}...`);
      this.$socket.emit(
        "pingServer",
        this.roomId,
        (ack) => "..." + this.log(ack)
      );
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },

    isToday(date) {
      let x = moment(date).format(this.today);
      let y = moment().add(-this.daysBack, "day").format(this.today);
      return x == y;
    },

    isBetween(date) {
      let visit = moment(date);

      let past = moment().add(-this.daysBack, "day").format("YYYY-MM-DD");
      let tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
      let test = visit.isBetween(past, tomorrow);
      return test;
    },

    deleteMessage(id) {
      if (this.daysBack == 0) {
        let m = `Deleting message ${id}`;
        this.log(m);
        Message.delete(id);
      } else {
        this.log(`Deleting all messages`);
        Message.deleteAll();
      }
    },
    // end helper methods
  },

  async created() {},

  async mounted() {
    console.log("Room.vue mounted");
    let self = this;
    if (!self.$socket.id) {
      self.connectToServer();
    } else {
      // we may need to refesh this vue's property if we come from the other vue
      self.socketId = self.$socket.id;
      self.log(`Mounted with socket ${self.socketId}`);
    }
    await Room.$fetch();
    await Name.$fetch();
    await State.$fetch();
    await Message.$fetch();
  },
};
</script>
