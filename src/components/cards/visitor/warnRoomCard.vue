<template>
  <v-card-actions class="py-1 text-center">
    <v-row justify="center">
      <v-btn
        height="5em"
        width="25em"
        color="error"
        dark
        @click="onWarnRooms"
        :disabled="disabled"
      >
        Warn
        <v-icon>mdi-home-alert</v-icon> Rooms
      </v-btn>
    </v-row>
  </v-card-actions>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onWarnRooms: function() {
      if (this.$socket.disconnected) {
        alert('disconnected');
      }
      this.$emit('warnRooms');
    },
  },
};
</script>
