<template>
  <v-card>
    <v-card-title>Connect to Local Contact Tracing</v-card-title>
    <v-card-subtitle
      >Currently, you're
      {{
        $socket.connected
          ? 'connected. Pick an open Room below.'
          : 'disconnected. '
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
        <v-col cols="6">
          <v-text-field
            v-if="newVisitor"
            label="Enter your nickname:"
            hint="How do you want to be seen?"
            persistent-hint
            clearable
            @change="onUpdateVisitor"
          />
          <v-select
            v-else
            v-model="selectedVisitor"
            :items="visitors"
            item-text="visitor"
            item-value="id"
            label="Pick your nickname"
            :hint="hint()"
            persistent-hint
            return-object
            single-line
            autofocus
            :prepend-icon="statusIcon"
            @change="onEmitVisitor"
          >
          </v-select>
        </v-col>
        <v-col class="text-center">
          <!-- <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                <speedDial
                  :room="false"
                  :mainIcon="mainIcon"
                  @added="onAddVisitor()"
                  @deleted="onDeleteVisitor()"
                />
              </span>
            </template>
            <span>Visitor Tasks</span>
          </v-tooltip> -->
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                <v-btn fab dark small color="green" @click="onAddVisitor()">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Add Visitor</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                <v-btn fab dark small color="orange" @click="onDeleteVisitor()">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Delete Visitor</span>
          </v-tooltip>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-row align="center" justify="space-between">
        <v-col v-if="$socket.connected" class="text-center ">
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
import base64id from 'base64id';

import Visitor from '@/models/Visitor';
import State from '@/models/State';

import warnRoomCard from '@/components/cards/visitor/warnRoomCard';
// import speedDial from '@/components/cards/SpeedDial';

export default {
  props: {
    log: {
      type: Function,
      default: null,
    },
  },
  components: {
    // speedDial,
    warnRoomCard,
  },
  computed: {
    // source for Visitor dropdown
    visitors() {
      let allvisitors = Visitor.all();
      return allvisitors;
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
      mainIcon: 'mdi-account-outline',
      newVisitor: false,
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
      if (this.$socket.id) {
        this.statusIcon = 'mdi-lan-connect';
        this.log(`Socket ${this.$socket.id} connected.`);
      }
    },
    disconnect() {
      this.statusIcon = 'mdi-lan-disconnect';
    },
  },

  methods: {
    hint() {
      return `ID: ${this.$socket.id}`;
    },
    onAddVisitor() {
      this.newVisitor = true;
    },

    onDeleteVisitor() {
      this.selectedVisitor = null;
    },

    connectToServer() {
      if (
        this.$socket.connected &&
        this.$socket.io.opts &&
        this.$socket.io.opts.query.id != this.selectedVisitor.visitor?.id
      ) {
        this.$socket.disconnect();
      }
      this.$socket.io.opts.query = {
        visitor: this.selectedVisitor.visitor,
        id: this.selectedVisitor.id,
        nsp: this.selectedVisitor.nsp,
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
      // ia this call necessary given we have a watcher on this variable? yes,
      // because the watcher handles deleted Visitors, and onEmitVisitor() does not
      State.changeYourId(this.selectedVisitor.id);
      this.connectToServer();

      this.$emit('visitor', this.selectedVisitor);
    },

    // update IndexedDb and set values for selection
    onUpdateVisitor(newVal) {
      this.newVisitor = false;
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
      // newVal is set to null when deleting a visitor
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
