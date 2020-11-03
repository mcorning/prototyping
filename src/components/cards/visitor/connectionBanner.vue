<template>
  <v-banner class="text-center">
    At the moment, the Server doesn't know about you. Reconnect?
    <template v-slot:actions>
      <v-btn text color="secondary" @click="connectToServer">Yes</v-btn>
      <v-btn text color="secondary" @click="disconnect">No</v-btn>
    </template>
  </v-banner>
</template>

<script>
export default {
  methods: { connectToServer: function() {}, disconnect: function() {} },
};
</script>
