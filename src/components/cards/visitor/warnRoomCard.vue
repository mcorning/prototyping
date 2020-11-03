<template>
  <v-card-actions class="py-1">
    <v-btn color="error" block dark @click="warnRooms" :disabled="disabled">
      Warn
      <v-icon>mdi-home-alert</v-icon> Rooms
    </v-btn>
  </v-card-actions>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
    },
  },
  methods: { warnRooms: function() {} },
};
</script>
