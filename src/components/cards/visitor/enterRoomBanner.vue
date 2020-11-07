<template>
  <v-banner class="text-center">
    Do you want to enter {{ selectedRoom.room }} now?
    <template v-slot:actions>
      <v-btn text color="secondary" @click="$emit('enterRoom', true)"
        >Yes</v-btn
      >
      <v-btn text color="secondary" @click="$emit('enterRoom', false)"
        >No</v-btn
      >
    </template>
  </v-banner>
</template>
<script>
export default {
  props: {
    selectedRoom: {
      type: Object,
    },
  },
};
</script>
