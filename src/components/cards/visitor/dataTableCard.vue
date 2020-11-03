<template>
  <v-card>
    <v-card-text>
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
export default {
  props: {
    daysBack: {
      type: Number,
    },
    entered: {
      type: Number,
    },
    allVisits: {
      type: Boolean,
    },
    messages: {
      type: Array,
    },
    visits: {
      type: Array,
    },
  },
  data: () => ({
    messageHeaders: [
      { text: 'Room', value: 'room' },
      { text: 'Visitor', value: 'visitor' },
      { text: 'Message', value: 'message' },
      { text: 'Sent  ', value: 'sentTime' },
      { text: 'Delete', value: 'action' },
    ],
  }),
  methods: {
    toggleVisits: function() {},
    refreshConnection: function() {},
    deleteAllMessages: function() {},
    deleteMessage: function() {},
    visitedDate: function() {},
  },
};
</script>
