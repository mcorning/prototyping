<template>
  <v-container fluid>
    <v-card>
      <v-card-title>First Time?</v-card-title>
      <v-card-text
        >Enter your nickname in the field below. We enable more than one
        nickname to use the same instance of the app or device.
      </v-card-text>
      <v-card-text>
        <v-text-field
          label="Enter your nickname:"
          hint="How do you want to be seen?"
          persistent-hint
          clearable
          autofocus
          @change="onUpdateVisitor"
        ></v-text-field
      ></v-card-text>
      <v-card-text
        >You can only visit an open Room. The Room dropdown gets its values from
        the Server.</v-card-text
      >
      <v-card-text
        >When you see the Room you want is open, select it.</v-card-text
      >
      <v-card-text>A selected room enables your Check-in button.</v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import Visitor from '@/models/Visitor';

import base64id from 'base64id';

export default {
  computed: {
    lastVisitor() {
      let id = State.find(0)?.visitorId;
      let v = this.findVisitorWithId(id);
      return v;
    },
  },

  data() {
    return {
      selectedVisitor: {},
    };
  },

  methods: {
    findVisitorWithId(id = this.selectedVisitor?.id) {
      let v = Visitor.find(id) || '';
      return v;
    },
    // update IndexedDb and set values for selection
    onUpdateVisitor(newVal) {
      this.selectedVisitor.visitor = newVal;
      this.selectedVisitor.id = base64id.generateId();
      // static update function on Visitor model
      try {
        Visitor.update(newVal, this.selectedVisitor.id, this.nsp).catch((e) =>
          console.log(e)
        );
      } catch (error) {
        alert(error);
      }

      this.onEmitVisitor();
    },

    onEmitVisitor() {
      // if we delete a nickname, no need to process selectedVisitor
      if (!this.selectedVisitor?.id) {
        return;
      }
      // ia this call necessary given we have a watcher on this variable?
      State.changeVisitorId(this.selectedVisitor.id);
      this.$emit('visitor', this.selectedVisitor);
    },

    selectedVisitorInit() {
      // first check for any visitor (onboarding will not have one yet)
      if (!Visitor.exists()) {
        // ensure there is a property (may be removed by removing a Visitor)
        this.selectedVisitor = { visitor: '', id: '' };
        return;
      }
      let x = State.find(0);
      if (!x) {
        alert('Welcome to Local Contact Tracing');
        return;
      }
      let id = x.visitorId;
      let v = this.findVisitorWithId(id);
      this.selectedVisitor = v;
      this.$emit('visitor', this.selectedVisitor);
    },
  },
  async mounted() {
    await State.$fetch();
    await Visitor.$fetch();
    this.selectedVisitorInit();
  },
};
</script>

<style lang="scss" scoped></style>
