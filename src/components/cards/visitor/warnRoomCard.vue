<template>
  <v-card-actions class="py-1 text-center">
    <v-row justify="center">
      <v-btn
        height="5em"
        color="error"
        dark
        @click="$emit('warnRooms')"
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
    },
  },
  methods: { warnRooms: function() {} },
};
</script>
