<template>
  <v-banner dark single-line @click:icon="alert">
    <v-icon slot="icon" color="warning" size="36">
      mdi-alert
    </v-icon>
    Alert Visitors

    <template v-slot:actions>
      <v-btn color="primary" text>
        See list of visit rooms/dates
      </v-btn>
    </template>
  </v-banner>
</template>

<script>
export default {
  methods: {
    alert() {
      alert('You alerted Rooms');
    },
  },
};
</script>
