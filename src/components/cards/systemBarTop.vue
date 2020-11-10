<template>
  <v-system-bar color="secondary">
    <v-row align="center">
      <v-col class="text-left">{{ $socket.io.uri }}</v-col>
      <slot></slot>
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
  methods: {
    refreshConnection(hard) {
      window.location.reload(hard);
    },
  },
};
</script>
