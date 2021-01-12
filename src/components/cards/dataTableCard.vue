<template>
  <v-card>
    <v-card-text v-if="loaded">
      <v-list dense>
        <v-row align="center" justify="space-between" dense>
          <v-col cols="6">
            <span
              >{{ daysBack == 0 ? 'Today' : 'All' }} {{ entered }} visits
            </span></v-col
          >
          <v-col cols="6">
            <div class="text-center">
              <v-checkbox
                :value="!allVisits"
                label="See today's visits"
                @change="toggleVisits"
              ></v-checkbox></div
          ></v-col>
          <v-col cols="12" v-if="allVisits && messages.length">
            <div class="text-center">
              <v-btn color="warning" block @click="deleteAllMessages"
                >Delete all visits</v-btn
              >
            </div></v-col
          >
        </v-row>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search Messages"
            single-line
            hide-details
            @click="daysBack = 14"
          ></v-text-field>
        </v-card-title>
        <v-data-table
          :search="search"
          :headers="messageHeaders"
          :items="visits"
          multi-sort
          :sort-by="['sentTime', 'room', 'visitor']"
          :sort-desc="[true, true, true]"
          item-key="id"
          dense
          :items-per-page="15"
          class="elevation-1"
        >
          <template v-slot:item.sentTime="{ item }">
            {{ visitedDate(item.sentTime) }}
          </template>

          <template v-slot:item.message="{ item }">
            <div class="text-center">
              <v-chip class="ma-2" :color="getColor(item.message)" dark>
                <v-avatar left>
                  <v-icon>{{ getIcon(item.message) }}</v-icon>
                </v-avatar>
                {{ item.message }}
              </v-chip>
            </div>
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
</template>

<script>
// import moment from 'moment';

import helpers from '@/mixins/helpers.js';

import Message from '@/models/Message';

export default {
  props: {
    roomName: {
      type: String,
      default: '',
    },
    log: { type: Function },
  },
  computed: {
    allVisits() {
      return this.daysBack != 0;
    },

    messages() {
      return Message.all();
    },

    visits() {
      const self = this;

      let allVisits = this.messages.filter((v) =>
        helpers.isBetween(v.sentTime, this.daysBack)
      );
      if (this.daysBack == 0) {
        if (self.roomName) {
          let roomVisits = this.messages.filter(
            (v) =>
              self.roomName == v.room &&
              helpers.isToday(v.sentTime, this.daysBack)
          );
          return roomVisits;
        } else {
          let roomVisits = this.messages.filter((v) =>
            helpers.isToday(v.sentTime, this.daysBack)
          );
          return roomVisits;
        }
      }
      return allVisits;
    },

    entered() {
      return this.visits.filter((v) => v.message == 'Entered').length;
    },

    departed() {
      return this.visits.filter((v) => v.message == 'Departed').length;
    },
  },

  data: () => ({
    search: '',
    daysBack: 14,
    today: 'YYYY-MM-DD',
    visitFormat: 'HH:mm:ss on ddd, MMM DD',

    loaded: false,
    messageHeaders: [
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Room', value: 'room' },
      { text: 'Message', value: 'message' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Delete', value: 'action' },
    ],
  }),
  methods: {
    getIcon(message) {
      switch (message.toLowerCase()) {
        case 'alerted':
          return 'mdi-alert';
        case 'warned by':
          return 'mdi-account-alert';
        case 'opened':
        case 'entered':
          return 'mdi-door-open';
        default:
          return 'mdi-door-closed';
      }
    },
    getColor(message) {
      switch (message.toLowerCase()) {
        case 'alerted':
          return 'error';
        case 'warned by':
          return 'warning';
        case 'entered':
          return 'primary';
        default:
          return 'secondary';
      }
    },

    deleteMessage(id) {
      let m = `Deleting message ${id}`;
      this.log(m);
      Message.delete(id);
    },

    deleteAllMessages() {
      this.log(`Deleting all messages`);
      Message.deleteAll();
    },

    toggleVisits() {
      this.daysBack = this.daysBack ? 0 : 14;
    },

    visitedDate(date) {
      return helpers.visitedDate(date);
    },
  },
  async mounted() {
    await Message.$fetch();
    this.loaded = true;
  },
};
</script>
