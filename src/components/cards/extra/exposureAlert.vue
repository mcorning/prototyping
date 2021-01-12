<template>
  <v-alert
    :value="alert"
    light
    dismissible
    border="left"
    :color="alertColor"
    elevation="5"
    colored-border
    :icon="alertIcon"
    transition="scale-transition"
    >Alert!
    <slot></slot>
  </v-alert>
</template>

<script>
export default {
  data: () => ({
    alertIcon: 'mdi-alert',
    alertColor: '',
    alert: false,
    alertMessage: '',
  }),

  methods: { connectToServer: function() {}, disconnect: function() {} },
};
</script>
