<template>
  <v-container>
    <v-card max-width="350" outlined>
      <v-card-title>
        Welcome to Local Contact Tracing
      </v-card-title>
      <v-card-subtitle>A prototype</v-card-subtitle>
      <v-card-text
        >If you came to visit after reading the Trinsic Newsletter, thanks for
        taking the time.</v-card-text
      >
      <v-card-text
        >Since this project is still under development, you might not be able to
        use all its capabilities.</v-card-text
      >
      <v-card-text
        >You will always see this UI, though I change it dozens of times a day,
        so it might look and act a little bit different every time you
        visit.</v-card-text
      >
      <v-card-text
        >This base level design uses socket.io for messaging (later versions may
        use Aries messaging). At this writing, I'm not happy with the way I'm
        running socket.io on the server.</v-card-text
      >
      <v-card-text
        >If the socket.io server is not running, you will see a message at the
        bottom of the Room or Visitor pages that says "Socket: not
        connected."</v-card-text
      >
    </v-card>
  </v-container>
</template>

<script>
// @ is an alias to /src
export default {
  name: 'Home',
  components: {},
};
</script>
