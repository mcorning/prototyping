<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :search="search"
      :headers="logHeaders"
      :items="cons"
      multi-sort
      must-sort
      :sort-by="['sentTime', 'type']"
      :sort-desc="[true, false]"
      calculate-widths
      item-key="id"
      dense
      :items-per-page="15"
      group-by="type"
      class="elevation-1"
    >
      <template v-slot:item.message="{ item }">
        <v-card flat :class="getTextColor(item.type)">
          {{ item.message }}
        </v-card>
      </template>
      <template v-slot:item.sentTime="{ item }">
        <v-card flat min-width="200" class="text-right">
          {{ visitedDate(item.sentTime) }}</v-card
        >
      </template>
      <template v-slot:item.type="{ item }">
        <v-icon :color="getIconColor(item.type)">mdi-{{ item.type }}</v-icon>
      </template>
    </v-data-table>
    <div class="text-center">
      How are we doing on the Visiter experience?
      <v-rating
        v-model="rating"
        background-color="primary lighten-3"
        color="primary"
        large
      ></v-rating>
    </div>
  </v-card>
</template>

<script>
import helpers from '@/mixins/helpers.js';

export default {
  props: {
    cons: {
      type: Array,
    },
  },
  data() {
    return {
      search: '',
      visitFormat: 'HH:mm on ddd, MMM DD',

      rating: 3,

      logHeaders: [
        { text: 'Message', value: 'message' },
        { text: 'Type', value: 'type' },
        { text: 'Sent  ', value: 'sentTime' },
      ],
    };
  },
  methods: {
    getTextColor(type) {
      return type == 'alert' ? 'red--text' : '';
    },
    getIconColor(type) {
      return type == 'alert' ? 'red' : 'gray';
    },
    visitedDate(date) {
      return helpers.visitedDate(date);
    },
  },
  mounted() {},
};
</script>
