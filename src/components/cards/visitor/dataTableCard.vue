<template>
  <v-card>
    <v-card-text v-if="loaded">
      <v-list dense>
        <v-row align="center" justify="space-between" dense>
          <v-col cols="5">
            <span
              >{{ daysBack == 0 ? 'Today' : 'All' }} {{ entered }} visits
            </span></v-col
          >
          <v-col>
            <div class="text-center">
              <v-checkbox
                :value="allVisits"
                label="See all visits"
                @change="toggleVisits"
              ></v-checkbox></div
          ></v-col>

          <v-col>
            <div class="text-center">
              <v-btn fab color="primary" small @click="refreshConnection(false)"
                ><v-icon>mdi-email-sync-outline</v-icon></v-btn
              >
            </div>
          </v-col>
          <v-col>
            <div class="text-center">
              <v-btn
                color="warning"
                :disabled="!allVisits || !messages.length"
                @click="deleteAllMessages"
                >Delete all visits</v-btn
              >
            </div></v-col
          >
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
</template>

<script>
import moment from 'moment';
import Message from '@/models/Message';

export default {
  props: {
    roomId: {
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
  },

  data: () => ({
    daysBack: 0,

    loaded: false,
    messageHeaders: [
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Delete', value: 'action' },
    ],
  }),
  methods: {
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

    refreshConnection(hard) {
      window.location.reload(hard);
    },

    toggleVisits() {
      this.daysBack = !this.daysBack ? 14 : 0;
    },

    visitedDate(date) {
      let x = moment(new Date(date)).format(this.visitFormat);
      return x;
    },
  },
  async mounted() {
    await Message.$fetch();
    this.loaded = true;
  },
};
</script>
