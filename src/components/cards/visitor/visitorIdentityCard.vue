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
            @change="onUpdateVisitor($event)"
          />
          <v-select
            v-else
            v-model="selectedVisitor"
            :items="visitors"
            item-text="visitor"
            item-value="id"
            label="Pick your nickname"
            :hint="hint"
            persistent-hint
            return-object
            single-line
            autofocus
            :prepend-icon="statusIcon"
            @change="onVisitorSelected()"
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
                  @connect="onVisitorSelected()"
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

    isLctSocket() {
      return this.$socket.io.opts.query ? true : false;
    },
    noVisitors() {
      return this.visitors.length == 0;
    },
  },

  data() {
    return {
      newVisitor: false,
      mainIcon: 'mdi-account-outline',
      // used by onUpdateVisitor() below
      // but what does nsp mean for a Visitor
      // if a Visitor can visit Rooms in any available nsp?
      nsp: '',
      selectedVisitor: this.parentSelectedVisitor,
      statusIcon: 'mdi-lan-disconnect',
    };
  },
  sockets: {
    //#region socket.io reserved events
    connect() {
      // ignore any non-Visitor sockets
      if (!this.$socket.io.opts.query) {
        this.$socket.disconnect();
        return;
      }
      const { visitor, id, nsp } = this.$socket.io.opts.query;
      console.group('onConnect');

      this.log(
        `Server connected using Id: ${id}, Visitor: ${visitor}, and nsp ${nsp} `,
        'visitorIdentityCard.vue'
      );
      console.groupEnd();
      // cache last Room used
      State.changeVisitorId(id);
      // set icon to indicate connect() handled
      this.statusIcon = 'mdi-lan-connect';
      this.$emit('visitor', this.selectedVisitor);
      this.hint = this.selectedVisitor.id;
    },

    //#region Other connection events
    disconnect(reason) {
      this.disconnectedFromServer = true;
      this.log(`Disconnect: ${reason}`, 'Visitor.vue');
      this.statusIcon = 'mdi-lan-disconnect';
    },
    error(reason) {
      this.log(`Error ${reason}`, 'Visitor.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'Visitor.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'Visitor.vue');
    },
    reconnect(reason) {
      this.log(`Recconnect ${reason}`, 'Visitor.vue');
      this.onVisitorSelected();
    },
    reconnect_attempt(reason) {
      this.log(`Reconnect_attempt ${reason}`, 'Visitor.vue');
    },
    reconnecting(reason) {
      this.log(`Reconnecting ${reason}`, 'Visitor.vue');
    },
    reconnect_error(reason) {
      this.log(`Reconnect_error ${reason}`, 'Visitor.vue');
    },
    reconnect_failed(reason) {
      this.log(`Reconnect_failed ${reason}`, 'Visitor.vue');
    },
    message(msg) {
      this.log(msg);
    },
    //#endregion
    //#endregion end socket.io reserved events
  },

  methods: {
    onAddVisitor() {
      this.newVisitor = true;
    },

    onDeleteVisitor() {
      this.selectedVisitor = null;
    },

    onWarned(data) {
      this.$emit('warned', data);
    },

    findVisitorWithId(id = this.selectedVisitor?.id) {
      let v = Visitor.find(id) || '';
      return v;
    },

    // update IndexedDb and set values for selection
    onUpdateVisitor(newVal) {
      console.assert(this.selectedVisitor, 'Missing selectedVisitor object.');
      this.selectedVisitor.visitor = newVal;
      this.selectedVisitor.id = base64id.generateId();
      // static update function on Visitor model
      Visitor.update(
        this.selectedVisitor.visitor,
        this.selectedVisitor.id,
        this.nsp
      )
        .then((v) => {
          console.log('New Visitor:', v);
          this.onVisitorSelected();
          this.newVisitor = false;
        })
        .catch((e) => console.log(e));
    },

    onVisitorSelected() {
      try {
        if (this.$socket.connected) {
          console.log(`${this.$socket.io.opts.query.visitor} is  connected`);
          if (
            this.$socket.io.opts.query.visitor == this.selectedVisitor.visitor
          ) {
            return;
          }
          console.log(
            `${this.selectedVisitor.visitor} is not connected. Disconnecting ${this.$socket.io.opts.query.visitor}`
          );
          this.$socket.disconnect();
        }

        this.log(`Connecting ${this.selectedVisitor.visitor} to Server...`);

        this.$socket.io.opts.query = {
          visitor: this.selectedVisitor.visitor,
          id: this.selectedVisitor.id,
          nsp: '',
        };
        this.$socket.connect();
        // }
      } catch (error) {
        console.info('onVisitorSelected:', error);
      }
    },

    selectedVisitorInit() {
      let id = State.find(0)?.visitorId;
      let v = this.findVisitorWithId(id);
      if (v) {
        this.selectedVisitor = v;
        this.onVisitorSelected();
      } else {
        this.selectedVisitor = { room: '', id: '' };
        this.newVisitor = true;
      }
    },
  },
  watch: {
    selectedVisitor(newVal, oldVal) {
      if (!newVal) {
        const self = this;
        Visitor.delete(oldVal.id).then((allVisitors) => {
          console.log('self.selectedVisitor :>> ', self.selectedVisitor);
          console.log('Visitors after delete:', allVisitors);
          if (allVisitors.length == 0) {
            console.log('self.selectedVisitor', self.selectedVisitor);
          }
          this.$socket.disconnect();
          this.newVisitor = this.noVisitors;
        });
      }
      if (!this.selectedVisitor) {
        this.selectedVisitor = { visitor: '', id: '' };
      }
    },
    selectedVisitorOrig(newVal, oldVal) {
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
