<template>
  <div>
    <v-alert
      v-model="alert"
      dismissible
      close-icon="mdi-delete"
      color="cyan"
      border="left"
      elevation="2"
      colored-border
      icon="mdi-alert"
    >
      You alerted Rooms
    </v-alert>

    <div class="text-center">
      <v-btn v-if="!alertMessage" color="error" block dark @click="warnRooms">
        Alert
        <v-icon>mdi-alert</v-icon> Rooms
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      alert: true,
    };
  },
};
</script>
