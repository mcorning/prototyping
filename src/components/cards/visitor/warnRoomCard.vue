<template>
  <v-container>
    {{ disabled }}
    <!-- <v-row v-if="dialog" justify="center"> -->
    <v-dialog v-model="dialog" persistent dark max-width="350">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          :disabled="disabled"
          block
          height="5em"
          width="25em"
          color="error"
          dark
          v-bind="attrs"
          v-on="on"
        >
          Warn
          <v-icon>mdi-home-alert</v-icon> Rooms
        </v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle>Dated: {{ dated }}</v-card-subtitle>
        <v-card-text>
          <v-select
            :v-model="reason"
            :items="warningTypes"
            label="Select your reason to warn Rooms:"
          ></v-select>
          <v-treeview open-all dense hoverable rounded :items="items">
          </v-treeview
        ></v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-title class="justify-end">Send warning?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning darken-1" text @click="onWarnRooms">Yes</v-btn>
          <v-btn color="green darken-1" text @click="dialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from 'moment';

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    visitorCheckins: { type: Array },
    visitor: { type: String },
    log: { type: Function },
  },
  computed: {
    rooms() {
      return this.items.reduce((a, c) => {
        a.push({ room: c.name });
        return a;
      }, []);
    },

    dated() {
      return moment(this.warnings.sentTime).format(
        'dddd, MMMM Do YYYY, h:mm a'
      );
    },
    items() {
      return this.groupMessagesByRoomAndDate({
        array: this.visitorCheckins,
        prop: 'room',
        val: 'sentTime',
      });
    },

    warningsMap() {
      // group the messages
      const warningsMap = this.mapMessagesByRoomAndDate({
        array: this.visitorCheckins,
        prop: 'room',
        val: 'sentTime',
      });
      return warningsMap;
    },

    warnings() {
      // Visitor hands off the warnings to the server,
      // goes into quarantine,
      // and stops using LCT
      // the server handles the rest

      const msg = {
        sentTime: new Date().toISOString(),
        visitor: this.visitor,
        reason: this.reason,
        warningsMap: [...this.warningsMap], // apparently it's up to us to serialize a Map before sending it across the wire
      };
      console.log('exposureWarning', this.printJson(msg));

      return msg;
    },
  },
  data() {
    return {
      reason: '',
      warningTypes: [
        'I tested tested Positive for COVID',
        'I was close to a Positive subject',
        'I present COVID symptoms',
        'LCT warned me of possible exposure',
      ],
      dialog: !this.disabled,
    };
  },
  methods: {
    emit(payload) {
      if (!this.$socket.id) {
        alert(
          'You are disconnected. Cannot warn Rooms. Refresh page, and try again.'
        );
        return;
      }
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    onWarnRooms() {
      this.dialog = false;
      this.log(this.warnings, 'EVENT: exposureWarning');
      this.emit({
        event: 'exposureWarning',
        message: this.warnings,
        ack: this.ackProc,
      });
    },

    ackProc(ack) {
      this.log(
        `Result of exposureWarning: ${this.printJson(ack)}`,
        'ACK: exposureWarning'
      );
      this.alert = true;
      this.alertIcon = 'mdi-warning';
      this.alertColor = 'yellow';
      this.alertMessage = ack;
      console.log('Results of exposureWarning:', this.printJson(ack));
      // Visitor will update messages so we don't warn twice
      this.$emit('warned', { rooms: this.rooms, reason: this.reason });
      return;
    },

    mapMessagesByRoomAndDate(payload) {
      // array constains filtered messages
      //       array: this.messages.filter(
      //   (v) => v.visitor == this.enabled.visitor.visitor
      // ),
      // prop is 'room' and val is 'sentTime'
      const { array, prop, val } = payload;
      let visitDates = [];
      return array.reduce(function(a, c) {
        // c[val] should not be blank
        visitDates.push(moment(c[val]).format('YYYY-MM-DD [at] hh:mm A'));
        a.set(c[prop], visitDates);
        return a;
      }, new Map());
    },

    /*
    this is what i have:
          "warningsMap": [
        [
            "fika",
            [
              "2020-11-17",
              "2020-11-18"
            ]
        ]
      ]

    this is what i want:
      items: [
          {
            id: 1,
            name: 'fika :',
            children: [
              { id: 2, name: '2020=11-17' },
              { id: 3, name: '2020-11-18' },
            ],
          },

    this is what i get:
      items: [
        {
            "id": 0,
            "name": "fika",
            "children": [
              {
                  "id": 0,
                  "name": "2020-11-17 at 01:43 PM"
              },
              {
                  "id": 1,
                  "name": "2020-11-17 at 11:52 AM"
              }
            ]
        }
      ]

   */
    groupMessagesByRoomAndDate() {
      const warningsMapAsArray = [...this.warningsMap];
      let items = warningsMapAsArray.reduce(function(a, c, i) {
        let ca = c[1].reduce((aa, cc, ii) => {
          let d = { id: ii, name: cc };
          aa.push(d);
          return aa;
        }, []);
        let o = { id: i, name: c[0], children: ca };
        a.push(o);
        return a;
      }, []);
      console.log(this.printJson(items));
      return items;
    },

    printJson(json) {
      return JSON.stringify(json, null, 3);
    },
  },
};
</script>
