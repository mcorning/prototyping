<template>
  <v-container>
    <v-overlay :value="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <v-dialog v-model="dialog" persistent max-width="350">
      <template v-slot:activator="{ on, attrs }" v-slot:extension>
        <v-fab-transition>
          <v-btn color="error" dark v-bind="attrs" v-on="on" fab x-large>
            <v-icon>mdi-home-alert</v-icon>
          </v-btn></v-fab-transition
        >
      </template>
      <!-- <v-card v-if="$socket.disconnected">
        <v-card-title class="headline">Disconnected</v-card-title>
        <v-card-subtitle>You cannot warn Rooms at the moment</v-card-subtitle>
        <v-card-text
          >You are not connected to the messaging server. We can cannect you,
          then you can click the Warn Rooms button. </v-card-text
        ><v-card-text> Do you want to connect now? </v-card-text>

        <v-card-actions>
          <v-btn color="green darken-1" text @click="connect()">Yes</v-btn>
          <v-btn color="green darken-1" text @click="dialog = false">No</v-btn>
        </v-card-actions>
      </v-card> -->

      <v-card v-if="items && items.length" color="primary" class="white--text">
        <v-card-title class="headline ">Exposure Warnings</v-card-title>
        <v-card-subtitle class="white--text"
          >Dated: {{ dated }}</v-card-subtitle
        >
        <v-card-subtitle class="white--text"
          >You will warn {{ items.length }}
          {{ items.length == 1 ? 'Room' : 'Rooms' }}</v-card-subtitle
        >
        <v-card-text>
          <v-card class="mx-auto" max-width="400">
            <v-list>
              <v-list-item-group v-model="model" mandatory color="primary">
                <v-list-item v-for="(item, i) in WarningOptions" :key="i">
                  <v-list-item-icon>
                    <v-icon v-text="item.icon"></v-icon>
                  </v-list-item-icon>

                  <v-list-item-content>
                    <v-list-item-title v-text="item.text"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-title class="justify-end">Send warning?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning lighten-2" text @click="onWarnRooms(false)"
            >Yes</v-btn
          >
          <v-btn color="green lighten-2" text @click="dialog = false">No</v-btn>
        </v-card-actions>
      </v-card>

      <v-card v-else>
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle> Oops, there is nobody to warn.</v-card-subtitle>
        ><v-card-text>
          1) Be sure you have selected the correct nickname </v-card-text
        ><v-card-text>
          2) Check your Visits (you need at least one Entered record before you
          can warn a Room)</v-card-text
        >
        <v-card-actions>
          <v-btn text @click="dialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="alert" max-width="450">
      <v-card dark class="white--text">
        <v-card-title>Are you sure you want to warn everybody?</v-card-title>
        <v-card-text class="white--text"
          >You cannot put this toothpaste back in the tube...</v-card-text
        >
        <v-card-actions>
          <v-btn color="red " text @click="onWarnRooms(true)">I'm sure</v-btn>
          <v-spacer></v-spacer>

          <v-btn color="green " text @click="alert = false">Never mind</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from 'moment';

import helpers from '@/mixins/helpers.js';
const { printJson, getNow } = helpers;

import Message from '@/models/Message';

export default {
  props: {
    visitor: { type: Object },
    log: { type: Function },
  },
  computed: {
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
      if (this.visitorCheckins?.length) {
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
        visitor: this.visitor,
        reason: this.WarningOptions[this.model].text,
        warningsMap: [...this.warningsMap], // apparently it's up to us to serialize a Map before sending it across the wire
      };

      return msg;
    },
  },
  data() {
    return {
      alert: false,
      WarningOptions: [
        {
          icon: 'mdi-alert',
          text: 'I tested positive for COVID-19',
        },
        {
          icon: 'mdi-account-alert',
          text: 'LCT warned me of exposure',
        },
        {
          icon: 'mdi-account-group',
          text: 'I was near a COVID carrier',
        },
        {
          icon: 'mdi-medical-bag',
          text: 'I present COVID symptoms',
        },
        {
          icon: 'mdi-arm-flex',
          text: 'This is an LCT Drill...',
        },
      ],
      model: 1,

      overlay: false,
      reason: 'LCT warned me of possible exposure',
      dialog: false,
      disconnected: true,
    };
  },
  sockets: {
    connect() {
      this.disconnected = false;
    },
    disconnect() {
      this.disconnected = true;
    },
  },

  methods: {
    connect() {
      this.dialog = false;
      this.$emit('connect');
    },

    // emits events to server
    emit(payload) {
      if (!this.$socket.id) {
        window.location.reload(true);
      }
      console.assert(this.$socket.id, 'Hard refesh did not work');
      this.$socket.emit(payload.event, payload.message, payload.ack);
    },

    onWarnRooms(confirmed) {
      if (!confirmed) {
        this.dialog = false;

        this.alert = true;
        return;
      }

      this.overlay = true;
      this.alert = false;

      console.groupCollapsed(
        `[${getNow()}] EVENT: onWarnRooms (warmRoomCard.vue) Warnings sent to Server:`
      );
      console.log(printJson(this.warnings));
      this.log(this.warnings, 'EVENT: exposureWarning');

      // send all visited Rooms and dates to server
      this.emit({
        // event: 'exposureWarning',
        event: 'stepOneVisitorWarnsRooms',
        message: this.warnings,
        ack: this.onWarnRoomsAck,
      });

      console.groupEnd();
    },

    // recieved from server
    onWarnRoomsAck(ack) {
      console.groupCollapsed(
        `[${getNow()}] ACK: onWarnRooms (warmRoomCard.vue) result: [${
          ack.result
        }]`
      );

      const msg = { rooms: this.rooms, reason: this.reason };
      this.log(
        `Result of exposureWarning: ${printJson(ack)}`,
        'ACK: exposureWarning'
      );
      console.log('Emitting to Visitor.vue:', printJson(msg));
      // Visitor will update messages so we don't warn twice
      this.$emit('warned', msg);
      console.groupEnd();
      this.overlay = false;
      return;
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

    // used by warningMaps to serialze to server that looks like this:
    // [
    //    [
    //       "DS301",
    //       [
    //          "2020-11-24"
    //       ]
    //    ]
    // ]
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

    // used by items() to group messages to look like this:
    // [
    //    {
    //       "id": 0,
    //       "name": "DS301",
    //       "children": [
    //          {
    //             "id": 0,
    //             "name": "2020-11-24"
    //          }
    //       ]
    //    }
    // ]
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
  },
  async mounted() {
    await Message.$fetch();
    console.info('Mounted warnRoomCard ');
  },
};
</script>
