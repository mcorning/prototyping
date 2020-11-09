<template>
  <v-row v-if="this.$socket.disconnected" justify="center">
    <v-dialog v-model="dialog" persistent max-width="290">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="primary" dark v-bind="attrs" v-on="on">
          Check Connection to Server
        </v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Get connected?</v-card-title>
        <v-card-text
          >At the moment, the Server doesn't know about you.
          Reconnect?</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="reconnect">Yes</v-btn>
          <v-btn color="green darken-1" text @click="dialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
    };
  },
  methods: {
    reconnect() {
      this.dialog = false;
      this.$emit('reconnect');
    },
  },
};
</script>
