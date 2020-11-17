<template>
  <v-system-bar color="secondary">
    <v-row align="center" dense>
      <v-col> {{ socketInfo }}</v-col>

      <v-col cols="2" class="text-right">
        <!-- <v-btn @click="disconnectFromServer" text>
          <v-icon>mdi-door-closed-lock</v-icon>
        </v-btn> -->
        <v-btn @click="$emit('showDetails')" text>
          <v-icon>mdi-glasses</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-system-bar>
</template>

<script>
export default {
  props: {
    socketMessage: {
      type: String,
    },
    log: { type: Function },
  },
  computed: {},
  data() {
    return {
      socketInfo: '',
    };
  },
  sockets: {
    // socket.io reserved events
    connect() {
      const query = this.$socket.io.opts?.query;
      if (!query) {
        this.socketInfo = `${this.$socket.id} isn't yours. Restart app.`;
        return;
      }

      const { id, nsp } = query;
      this.socketInfo = `ID: ${id} [${nsp ? nsp : '/'}]`;
    },
    disconnect() {
      this.socketInfo = `Disconnected`;
    },
  },
  methods: {
    disconnectFromServer() {
      this.$socket.disconnect(true);
    },
  },
};
</script>
