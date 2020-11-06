<template>
  <v-banner class="text-center">
    At the moment, the Server doesn't know about you. Reconnect?
    <template v-slot:actions>
      <v-btn text color="secondary" @click="$emit('reconnect')">Yes</v-btn>
    </template>
  </v-banner>
</template>

<script>
export default {};
</script>
