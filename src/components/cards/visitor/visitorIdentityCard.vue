<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <v-text-field
            v-if="visitors.length == 0"
            label="Enter your handle or nickname"
            hint="How do you want to be seen?"
            persistent-hint
            clearable
            @change="updateVisitor"
          ></v-text-field>
          <v-select
            v-else
            v-model="selectedVisitor"
            :items="visitors"
            item-text="visitor"
            item-value="id"
            label="Pick your Handle"
            clearable
            return-object
            single-line
            @change="getVisitor"
          ></v-select>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import Visitor from '@/models/Visitor';
import State from '@/models/State';
import base64id from 'base64id';

export default {
  props: {
    socket: {
      type: Object,
    },
  },

  computed: {
    visitors() {
      return Visitor.all();
    },

    visitor() {
      let v = Visitor.find(this.selectedVisitor?.id) || '';
      return v;
    },
  },

  data() {
    return {
      handle: '',
      nsp: 'enduringNet',
      selectedVisitor: { visitor: '', id: '' },
    };
  },

  methods: {
    getVisitor() {
      let v = this.visitor;
      this.$emit('visitor', v);
    },

    // update IndexedDb and set values for selection
    updateVisitor(newVal) {
      this.selectedVisitor.id = base64id.generateId();
      // static update function on Visitor model
      Visitor.update(newVal, this.uniqueId, this.nsp).catch((e) =>
        console.log(e)
      );

      // static changeYourId function on State model
      State.changeYourId(this.uniqueId);

      // you may want to do this in Visitor.vue
      // this.connectToServer();

      this.$emit('visitor', this.visitor);
      this.selectedVisitor.visitor = newVal;
    },
  },
  watch: {
    selectedVisitor(newVal, oldVal) {
      if (!newVal) {
        Visitor.delete(oldVal.id);
      }
    },
  },
  async mounted() {
    await State.$fetch();
    await Visitor.$fetch();
  },
};
</script>
