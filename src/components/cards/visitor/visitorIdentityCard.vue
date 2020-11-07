<template>
  <div>
    <v-col v-if="firstTime"><firstTimeCard /></v-col>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field
              v-if="onboard"
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
              @change="emitVisitor"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Visitor from '@/models/Visitor';
import State from '@/models/State';
import base64id from 'base64id';
import firstTimeCard from '@/components/cards/visitor/firstTimeCard';

const ONBOARD = 'Onboard me...';

export default {
  components: { firstTimeCard },
  computed: {
    firstTime() {
      // visitors[0]==ONBOARD
      let x = Visitor.all();
      return x.length === 0;
    },

    onboard() {
      // we might ber deleting the selectedVisitor
      return this.firstTime || this.selectedVisitor?.visitor === ONBOARD;
    },
    // source for Visitor dropdown
    visitors() {
      let allvisitors = Visitor.all();
      return [...allvisitors, ...[{ visitor: ONBOARD, id: '' }]];
    },

    visitor() {
      let v = Visitor.find(this.selectedVisitor?.id) || '';
      return v;
    },

    lastVisitor() {
      let id = State.find(0)?.visitorId;
      let v = this.findVisitorWithId(id);
      return v;
    },
  },

  data() {
    return {
      nsp: 'enduringNet',
      selectedVisitor: {},
    };
  },

  methods: {
    findVisitorWithId(id = this.selectedVisitor?.id) {
      let v = Visitor.find(id) || '';
      return v;
    },

    emitVisitor() {
      State.changeYourId(this.selectedVisitor.id);
      this.$emit('visitor', this.selectedVisitor);
    },

    // update IndexedDb and set values for selection
    updateVisitor(newVal) {
      this.selectedVisitor.visitor = newVal;
      this.selectedVisitor.id = base64id.generateId();
      // static update function on Visitor model
      Visitor.update(newVal, this.selectedVisitor.id, this.nsp).catch((e) =>
        console.log(e)
      );
      this.emitVisitor();
    },

    selectedVisitorInit() {
      let x = State.find(0);
      if (!x) {
        alert('State appears empty');
        return;
      }
      let id = x.visitorId;
      let v = this.findVisitorWithId(id);
      this.selectedVisitor = v;
      this.$emit('visitor', this.selectedVisitor);
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
    this.selectedVisitorInit();
  },
};
</script>
