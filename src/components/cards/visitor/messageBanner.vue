<template>
  <v-banner dark class="text-center black--text" :color="bgcolor">
    <slot></slot>
  </v-banner>
</template>
<script>
export default {
  props: {
    bgcolor: {
      type: String,
      default: '',
    },
  },
};
</script>
