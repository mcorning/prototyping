<template>
  <v-card>
    <v-card-title>Connect to the Server</v-card-title>
    <v-card-subtitle
      >Currently, you're
      {{
        $socket.connected ? 'connected. Pick a Room below.' : 'disconnected. '
      }}
      <v-btn
        v-if="$socket.disconnected"
        color="secondary lighten-2"
        class="black--text"
        small
        @click="onEmitVisitor()"
        >Connect?</v-btn
      >
    </v-card-subtitle>
    <v-card-text>
      <v-row class="child-flex" align="center" justify="space-between">
        <v-col cols="8" sm="6" md="4">
          <v-select
            v-model="selectedVisitor"
            :items="visitors"
            item-text="visitor"
            item-value="id"
            label="Pick your Handle"
            hint="The X button lets you delete this (nick)name (but do so carefully)."
            persistent-hint
            clearable
            return-object
            single-line
            autofocus
            :prepend-icon="statusIcon"
            @change="onEmitVisitor"
          >
          </v-select>
        </v-col>
        <v-col
          v-if="$socket.connected"
          cols="4"
          sm="6"
          md="4"
          class="text-right"
        >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on" class="text-center">
                <warnRoomCard
                  :visitor="selectedVisitor"
                  :log="log"
                  @warned="onWarned($event)"
                  @connect="connectToServer()"
                />
              </span>
            </template>
            <span>Warn Rooms</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import Visitor from '@/models/Visitor';
import State from '@/models/State';
import base64id from 'base64id';
import warnRoomCard from '@/components/cards/visitor/warnRoomCard';

const ONBOARD = 'Onboard me...';

export default {
  props: {
    log: {
      type: Function,
      default: null,
    },
  },
  components: { warnRoomCard },
  computed: {
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
      dialog: false,
      // used by onUpdateVisitor() below
      // but what does nsp mean for a Visitor
      // if a Visitor can visit Rooms in any available nsp?
      nsp: '',
      selectedVisitor: {},
      statusIcon: 'mdi-lan-disconnect',
    };
  },
  sockets: {
    connect() {
      this.statusIcon = 'mdi-lan-connect';
    },
    disconnect() {
      this.statusIcon = 'mdi-lan-disconnect';
    },
  },

  methods: {
    connectToServer() {
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != this.selectedVisitor.visitor?.id
      ) {
        this.$socket.disconnect();
      }
      this.$socket.io.opts.query = {
        visitor: this.selectedVisitor.visitor.visitor,
        id: this.selectedVisitor.visitor.id,
        nsp: this.selectedVisitor.visitor.nsp,
      };
      this.$socket.connect();
    },
    onWarned(data) {
      this.$emit('warned', data);
    },

    findVisitorWithId(id = this.selectedVisitor?.id) {
      let v = Visitor.find(id) || '';
      return v;
    },

    onEmitVisitor() {
      // if we delete a nickname, no need to process selectedVisitor
      if (!this.selectedVisitor?.id) {
        return;
      }
      // ia this call necessary given we have a watcher on this variable?
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
        // deleting the last Visitor will leave Visitor entity null...
        if (!Visitor.exists()) {
          // ...so reinitialize it back in play wo we don't fail at onUpdateVisitor() above
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
