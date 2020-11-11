<template>
  <div>
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
              autofocus
              @change="onUpdateVisitor"
            ></v-text-field>
            <v-select
              v-else
              v-model="selectedVisitor"
              :items="visitors"
              item-text="visitor"
              item-value="id"
              label="Pick your Handle"
              hint="The X button lets you delete this handle (but do so carefully)."
              persistent-hint
              clearable
              return-object
              single-line
              @change="onEmitVisitor"
            >
            </v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-col v-if="firstTime"><firstTimeCard /></v-col>
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

    onEmitVisitor() {
      if (!this.selectedVisitor) {
        alert('The selectedVisitor object is null.');
        return;
      }
      State.changeYourId(this.selectedVisitor.id);
      this.$emit('visitor', this.selectedVisitor);
    },

    // update IndexedDb and set values for selection
    onUpdateVisitor(newVal) {
      console.assert(this.selectedVisitor, 'Missing selectedVisitor object.');
      this.selectedVisitor.visitor = newVal;
      this.selectedVisitor.id = base64id.generateId();
      // static update function on Visitor model
      Visitor.update(newVal, this.selectedVisitor.id, this.nsp).catch((e) =>
        console.log(e)
      );
      this.onEmitVisitor();
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
  watch: {
    selectedVisitor(newVal, oldVal) {
      if (!newVal) {
        Visitor.delete(oldVal.id);
        // deleting the last Visitor will leave this.selectedVisitor null...
        if (!Visitor.exists()) {
          // ...so put it back in play wo we don't fail at onUpdateVisitor() above
          this.selectedVisitor = { visitor: '', id: '' };
          return;
        }
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
