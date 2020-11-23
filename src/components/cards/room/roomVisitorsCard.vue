<template>
  <v-card v-if="loaded">
    <v-row dense>
      <v-col cols="12">
        <v-card-text class="pb-0">
          <v-subheader>
            <v-row align="center" justify="space-between">
              <v-col>
                <span>
                  Today's Visitor Log - {{ entered }} visits [{{
                    uniqueVisitorNames.length
                  }}
                  unique visitor(s)]
                </span>
              </v-col>
              <v-col>
                <v-checkbox
                  :value="!allVisits"
                  label="See today's visits"
                  @change="toggleVisits"
                ></v-checkbox>
              </v-col>
              <div class="text-center">
                <v-btn
                  fab
                  color="primary"
                  small
                  @click="refreshConnection(false)"
                  ><v-icon>mdi-email-sync-outline</v-icon></v-btn
                >
              </div>
              <v-col>
                <div class="text-center">
                  <v-btn
                    color="warning"
                    :disabled="!seeAllVisits || !messages.length"
                    @click="deleteAllMessages"
                    >Delete all visits</v-btn
                  >
                </div></v-col
              >
            </v-row>
          </v-subheader>
          <v-data-table
            :headers="messageHeaders"
            :items="visits"
            item-key="id"
            multi-sort
            :sort-by="['sentTime', 'visitor', 'room', 'status']"
            :sort-desc="[true, true]"
            dense
            class="elevation-1"
          >
            <template v-slot:item.sentTime="{ item }">{{
              visitedDate(item.sentTime)
            }}</template>
            <template v-slot:item.action="{ item }">
              <v-icon @click="deleteMessage(item.id)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-card-text>
      </v-col>
      <v-col>
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
  </v-card>
</template>

<script>
import moment from 'moment';
import Message from '@/models/Message';

export default {
  props: {
    selectedRoom: {
      type: Object,
    },
    log: { type: Function },
  },

  computed: {
    entered() {
      return this.visits.filter((v) => v.message.toLowerCase() == 'entered')
        .length;
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

    seeAllVisits() {
      return this.daysBack != 0;
    },

    visits() {
      if (!this.messages.length) {
        return [];
      }

      if (this.daysBack == 0) {
        let self = this;
        // limit visits to those of the current Room (previous vues may have used different Rooms)
        let roomVisits = this.messages.filter(
          (v) => self.selectedRoom.room == v.room && self.isToday(v.sentTime)
        );
        return roomVisits;
      }
      return this.messages;
    },

    uniqueVisitorNames() {
      return Array.from(new Set(this.messages.map((v) => v.visitor)));
    },
  },

  data() {
    return {
      today: 'YYYY-MM-DD',

      alertHeaders: [
        { text: 'Date of Alert', value: 'sentTime' },
        { text: 'Visitor', value: 'visitor' },
      ],
      daysBack: 14,
      listUniqueVisitors: false,
      loaded: false,
      messageHeaders: [
        { text: 'Sent  ', value: 'sentTime' },
        { text: 'Visitor', value: 'visitor' },
        { text: 'Message', value: 'message' },
        { text: 'Room', value: 'room' },
        { text: 'Delete', value: 'action' },
      ],
      visitFormat: 'HH:mm:ss on ddd, MMM DD',
    };
  },

  methods: {
    isToday(date) {
      let x = moment(date).format(this.today);
      let y = moment()
        .add(-this.daysBack, 'day')
        .format(this.today);
      return x == y;
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
