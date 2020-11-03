<template>
  <v-banner color="primary" class="text-center">
    Do you want to enter {{ roomId }} now?
    <template v-slot:actions>
      <v-btn text color="secondary" @click="changeRoom">Yes</v-btn>
      <v-btn text color="secondary" @click="doNotChangeRoom">No</v-btn>
    </template>
  </v-banner>
</template>
<script>
export default {
  props: {
    roomId: {
      type: String,
    },
  },
  methods: { changeRoom: function() {}, doNotChangeRoom: function() {} },
};
</script>
