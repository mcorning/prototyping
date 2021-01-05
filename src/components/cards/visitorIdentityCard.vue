<template>
  <div>
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
          <v-col cols="8">
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
              :disabled="entered"
            >
            </v-select>
          </v-col>

          <v-col cols="4">
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
                  <v-btn
                    fab
                    dark
                    small
                    color="orange"
                    @click="onDeleteVisitor()"
                  >
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
  </div>
</template>

<script>
import base64id from 'base64id';

import Visitor from '@/models/Visitor';

import warnRoomCard from '@/components/cards/warnRoomCard';

import helpers from '@/mixins/helpers.js';
const { printJson, getNow } = helpers;

import clc from 'cli-color';
// const success = clc.green.bold;
// const error = clc.red.bold;
// const warn = clc.yellow;
// const info = clc.cyan;
// const notice = clc.blue;
const highlight = clc.magenta;
// const bold = clc.bold;

export default {
  props: {
    entered: { type: Boolean, default: false },
    log: {
      type: Function,
      default: null,
    },
  },
  components: {
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
    defaultVisitor() {
      if (this.selectedVisitor.id) {
        let v = Visitor.find(this.selectedVisitor?.id)?.visitor || '';
        return v;
      }
      return '';
    },

    noVisitors() {
      return this.visitors.length == 0;
    },
  },

  data() {
    return {
      dialog: false,
      deferConnection: false,
      reconnected: false,
      hint: '',
      newVisitor: false,
      mainIcon: 'mdi-account-outline',
      statusIcon: 'mdi-lan-disconnect',
      nsp: '',
      selectedVisitor: {},
    };
  },
  sockets: {
    //#region socket.io reserved events
    connect() {
      const { visitor, id, nsp } = this.getQuery();

      console.log(this.$socket.id, visitor, id, this.$socket.query);

      // OBX sends a socket with an ID generated on the server and copied in the query options
      if (this.$socket.connected && !id) {
        this.newVisitor = this.noVisitors;
        return;
      }

      // set the selectedVisitor object
      if (!this.selectedVisitor.visitor) {
        this.selectedVisitor = { visitor: visitor, id: id, nsp: nsp };
      }

      console.group('Step 0: connect() at', Date.now());
      console.log(
        highlight(
          this.$socket.id,
          this.$socket.connected,
          printJson(this.$socket.io.opts)
        )
      );

      if (this.reconnected) {
        this.log('Reconnected. No need to connect(). Returning');
        return;
      }

      console.log(`Connecting ${visitor}`);

      this.log(
        `Server connected using Id: ${id}, Visitor: ${visitor}, and nsp ${nsp} `,
        'visitorIdentityCard.vue'
      );

      console.groupEnd();
      console.log(' ');

      // set icon to indicate connect() handled
      this.statusIcon = 'mdi-lan-connect';
      this.hint = id;
      this.$emit('visitor', this.selectedVisitor);
    },

    reconnect(reason) {
      if (!this.getQuery()) {
        return;
      }
      // this.query = this.parseParams(this.$socket.io.opts.query);
      console.group('onReconnect');
      console.log(
        highlight(
          `[${getNow()}] ${this.printQuery()} Recconnect ${reason}`,
          'visitorIdentityCard.vue'
        )
      );
      const msg = {
        visitor: this.getQuery().visitor,
        message: 'Reconnected',
        sentTime: new Date().toISOString(),
      };
      this.messages = msg;
      this.log(`Reconnect ${reason}`, 'visitorIdentityCard.vue');
      console.groupEnd();

      this.onVisitorSelected('reconnect');
    },

    //#region Other connection events
    disconnect(reason) {
      this.log(`Disconnect: ${reason}`, 'Visitor.vue');
      this.statusIcon = 'mdi-lan-disconnect';
    },
    error(reason) {
      this.dialog = false;
      this.log(`Error ${reason}`, 'Visitor.vue');
    },
    connect_error(reason) {
      this.log(`Connect_error ${reason}`, 'Visitor.vue');
    },
    connect_timeout(reason) {
      this.log(`Connect_timeout ${reason}`, 'Visitor.vue');
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
    parseParams(querystring) {
      // parse query string
      const params = new URLSearchParams(querystring);

      const obj = {};

      // iterate over all keys
      for (const key of params.keys()) {
        if (params.getAll(key).length > 1) {
          obj[key] = params.getAll(key);
        } else {
          obj[key] = params.get(key);
        }
      }

      return obj;
    },

    deleteVisitor(visitor) {
      const self = this;
      Visitor.delete(visitor.id).then((allVisitors) => {
        this.log(
          `Deleted ${printJson(visitor)} and disconnected ${this.$socket.id}`
        );
        this.$socket.disconnect(true);
        if (allVisitors.length == 0) {
          console.log('self.selectedVisitor', self.selectedVisitor);
        }
      });
      // if we deleted the last saved Room, reset the v-model
      if (!this.selectedVisitor) {
        this.selectedVisitor = { visitor: '', id: '' };
      }
      this.newVisitor = this.noVisitors;
    },

    onChangeSocket() {
      this.$socket.disconnect(true);
    },

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

    connectToServer() {
      this.dialog = false;
      const { visitor, id, nsp } = this.selectedVisitor;

      console.log('Inside connectToServer()');
      const query = {
        visitor: visitor,
        id: id,
        nsp: nsp,
      };
      this.$socket.io.opts.query = query;

      console.log(
        highlight(
          'Connecting with query options:',
          printJson(this.$socket.io.opts.query)
        )
      );

      this.$socket.connect();
    },

    getQuery() {
      let query = this.$socket.io.opts.query || {
        visitor: '',
        id: '',
        nsp: '',
      };
      return query;
    },

    printQuery() {
      const query = this.getQuery();
      if (!query.id) {
        return 'Empty query';
      }
      return printJson(query);
    },

    // Called by text-field with Visitor's name.
    //update IndexedDb and set values for selection
    onUpdateVisitor(newVal) {
      console.assert(this.selectedVisitor, 'Missing selectedVisitor object.');
      this.selectedVisitor.visitor = newVal;
      // OBX provides a Visitor ID
      // But one added in the UI does not, so generate one here
      if (this.newVisitor) {
        this.selectedVisitor.id = base64id.generateId();
      }
      // static update function on Visitor model
      Visitor.update(
        this.selectedVisitor.visitor,
        this.selectedVisitor.id,
        this.nsp,
        Date.now()
      ).then((v) => {
        console.log('New Visitor:', v);
        this.onVisitorSelected('updateVisitor');
        this.newVisitor = false;
      });
    },

    onVisitorSelected(caller) {
      try {
        this.reconnected = false;
        if (
          !this.selectedVisitor.id ||
          this.getQuery().id == this.selectedVisitor.id
        ) {
          return;
        }

        console.group(`Step 4: onVisitorSelected ${caller}`);

        console.log(highlight('Old query:', this.printQuery()));

        this.onChangeSocket();

        this.log(`Connecting ${this.selectedVisitor.visitor} to Server...`);

        // this.dialog = true;
        this.connectToServer();
        console.log('Leaving onVisitorSelected() at ', Date.now());
        console.groupEnd();
      } catch (error) {
        console.error('onVisitorSelected:', error);
      }
    },
  },

  watch: {
    selectedVisitor(newVal, oldVal) {
      console.groupCollapsed('Step 3: selectedRoom watch');

      if (!newVal) {
        console.log('Deleting', oldVal.visitor);
        this.deleteVisitor(oldVal);
        return;
      }

      if (!this.selectedVisitor) {
        console.log('Resetting selectedVisitor');
        this.selectedVisitor = { visitor: '', id: '' };
        return;
      }

      console.log('Changing selectedVisitor');
      console.groupEnd();
      console.log(' ');

      this.onVisitorSelected('watch');
    },
  },

  created() {},

  async mounted() {
    await Visitor.$fetch();

    console.group('Step 1: mounted()');
    console.log(highlight('First query:', this.printQuery()));
    console.groupEnd();
    console.log(' ');
  },
};
</script>
