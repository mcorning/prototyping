<template>
  <div>
    <v-banner v-if="$socket.disconnected" color="warning" class="text-center">
      The Server appears to be down. When it comes back up, this warning will
      disappear. Then you will be able to log in to Rooms, as usual.
    </v-banner>
  </div></template
>

<script>
export default {};
</script>
