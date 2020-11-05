<template>
  <v-system-bar color="secondary">
    <v-row align="center" justify="space-between">
      <v-col>{{ socketInfo }}</v-col>
      <v-col class="text-right">
        <v-btn @click="disconnectFromServer" text>
          <v-icon>mdi-door-closed-lock</v-icon>
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
      socketInfo: `Pick a ${this.socketMessage}`,
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

      const { id, nsp, visitor, room } = query;
      this.socketInfo = `${visitor || room}  [${id} ${nsp}]`;
    },
    disconnect() {
      this.socketInfo = `Pick a ${this.socketMessage}`;
    },
  },
  methods: {
    disconnectFromServer() {
      this.$socket.disconnect(true);
    },
  },
};
</script>
