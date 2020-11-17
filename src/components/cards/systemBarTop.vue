<template>
  <v-system-bar color="secondary">
    <v-row align="center" dense>
      <v-col class="text-left">{{ $socket.io.uri }}</v-col>
      <v-col class="text-center"> {{ socketInfo }}</v-col>

      <v-col class="text-right">
        <v-btn text @click="refreshConnection(true)"
          ><v-icon>mdi-block-helper</v-icon>{{ $build }}</v-btn
        ></v-col
      >
    </v-row>
  </v-system-bar>
</template>
<script>
export default {
  props: {},
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

      this.socketInfo = `Connected`;
    },
    disconnect() {
      this.socketInfo = `Disconnected`;
    },
  },
  methods: {
    refreshConnection(hard) {
      window.location.reload(hard);
    },
  },
};
</script>
