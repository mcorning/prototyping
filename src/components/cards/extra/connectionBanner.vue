<template>
  <div>
    <v-banner v-if="connectionMessage" color="warning" class="text-center">
      {{ connectionMessage }}
    </v-banner>
  </div></template
>

<script>
export default {
  props: {
    connectionMessage: { type: String },
  },
};
</script>
