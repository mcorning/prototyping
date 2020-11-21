<template>
  <v-container>
    <v-dialog v-model="dialog" persistent dark max-width="350">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
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
      <v-card v-if="items && items.length">
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle>Dated: {{ dated }}</v-card-subtitle>
        <v-card-text>
          <v-select
            v-model="reason"
            :items="warningTypes"
            label="Select your reason to warn Rooms:"
          ></v-select>
          <v-treeview open-all dense hoverable rounded :items="items" />
        </v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-title class="justify-end">Send warning?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning darken-1" text @click="onWarnRooms">Yes</v-btn>
          <v-btn color="green darken-1" text @click="dialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-else>
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle> There is nobody to warn.</v-card-subtitle>
        <v-card-text>You have not entered any Rooms yet. </v-card-text
        ><v-card-text> To use LCT, pick a Room above and enter it. </v-card-text
        ><v-card-text>
          Then you will be able to warn others if you go into
          quarantine.</v-card-text
        >
        <v-card-actions>
          <v-btn color="green darken-1" text @click="dialog = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from 'moment';
import Message from '@/models/Message';

export default {
  props: {
    visitor: { type: Object },
    log: { type: Function },
  },
  computed: {
    warningTypes() {
      return [
        'LCT warned me of possible exposure',
        'I tested tested Positive for COVID',
        'I was close to a Positive subject',
        'I present COVID symptoms',
      ];
    },

    messages() {
      return Message.all();
    },

    visitorCheckins() {
      if (this.visitor) {
        let x = this.messages.filter(
          (v) => v.visitor == this.visitor.visitor && v.message == 'Entered'
        );
        return x;
      }
      return null;
    },

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
      if (this.visitorCheckins.length) {
        let x = this.groupMessagesByRoomAndDate({
          array: this.visitorCheckins,
          prop: 'room',
          val: 'sentTime',
        });
        return x;
      } else {
        return null;
      }
    },

    warningsMap() {
      if (this.visitor) {
        // group the messages
        const warningsMap = this.mapMessagesByRoomAndDate({
          array: this.visitorCheckins,
          prop: 'room',
          val: 'sentTime',
        });
        return warningsMap;
      } else {
        return null;
      }
    },

    warnings() {
      const msg = {
        sentTime: new Date().toISOString(),
        visitor: this.visitor.id,
        reason: this.reason,
        warningsMap: [...this.warningsMap], // apparently it's up to us to serialize a Map before sending it across the wire
      };

      return msg;
    },
  },
  data() {
    return {
      reason: 'LCT warned me of possible exposure',
      dialog: false,
    };
  },
  methods: {
    getNow() {
      return moment().format('HH:mm:ss');
    },

    emit(payload) {
      if (!this.$socket.id) {
        window.location.reload(true);
      }
      console.assert(this.$socket.id, 'Hard refesh did not work');
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    onWarnRooms() {
      this.dialog = false;
      console.groupCollapsed(
        `[${this.getNow()}] EVENT: onWarnRooms (warmRoomCard.vue) Warnings sent to Server:`
      );
      console.log(this.printJson(this.warnings));
      this.log(this.warnings, 'EVENT: exposureWarning');
      this.emit({
        event: 'exposureWarning',
        message: this.warnings,
        ack: this.onWarnRoomsAck,
      });
      console.groupEnd();
    },

    onWarnRoomsAck(ack) {
      console.groupCollapsed(
        `[${this.getNow()}] ACK: onWarnRooms (warmRoomCard.vue) result: [${
          ack.result
        }]`
      );

      this.alert = true;
      this.alertIcon = 'mdi-warning';
      this.alertColor = 'yellow';
      this.alertMessage = ack;
      const msg = { rooms: this.rooms, reason: this.reason };
      this.log(
        `Result of exposureWarning: ${this.printJson(ack)}`,
        'ACK: exposureWarning'
      );
      console.log('Emitting to Visitor.vue:', this.printJson(msg));
      // Visitor will update messages so we don't warn twice
      this.$emit('warned', msg);
      console.groupEnd();
      return;
    },

    mapMessagesByRoomAndDate(payload) {
      if (this.visitor) {
        // array constains filtered messages
        //       array: this.messages.filter(
        //   (v) => v.visitor == this.enabled.visitor.visitor
        // ),
        // prop is 'room' and val is 'sentTime'
        const { array, prop, val } = payload;
        let visitDates = [];
        return array.reduce(function(a, c) {
          // c[val] should not be blank
          visitDates.push(moment(c[val]).format('YYYY-MM-DD'));
          a.set(c[prop], visitDates);
          return a;
        }, new Map());
      } else {
        return null;
      }
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
      if (this.visitor) {
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
        return items;
      } else {
        return null;
      }
    },

    printJson(json) {
      return JSON.stringify(json, null, 3);
    },
  },
  async mounted() {
    await Message.$fetch();
    console.info('Mounted warnRoomCard ');
  },
};
</script>
