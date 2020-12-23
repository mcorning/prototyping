<template>
  <div>
    <v-dialog v-model="dialog" max-width="340">
      <v-card>
        <v-card-title class="headline"
          >Connect {{ defaultVisitor }} to LCT?</v-card-title
        >
        <v-card-subtitle
          >[Connect later] to use another Visitor alias</v-card-subtitle
        >
        <v-card-subtitle>
          <template>
            Before you can select an open Room, you must
            <ul>
              <li>have internet access</li>
              <li>
                establish a connection to the server
              </li>
            </ul>
          </template>
        </v-card-subtitle>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="connectToServer()">
            Connect now
          </v-btn>

          <v-btn color="green darken-2" text @click="dialog = false">
            Connect later
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
            >
              <!-- @change="onVisitorSelected('select')" -->
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
import State from '@/models/State';

import warnRoomCard from '@/components/cards/visitor/warnRoomCard';

import helpers from '@/components/js/helpers.js';
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
      let v = Visitor.find(this.selectedVisitor?.id)?.visitor || '';
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
      console.group('Step 0: connect() at', Date.now());
      console.log(
        highlight(this.$socket.id, this.$socket.connected, this.$socket.io.opts)
      );

      console.groupEnd();
      console.log(' ');

      if (this.reconnected) {
        this.log('Reconnected. No need to connect(). Returning');
        return;
      }

      // service workers, apparently, are messing up the socket connections so the socket.id doesn't match the Room
      // when that happens, we explicitly connect to server through the dialog
      if (
        this.$socket.io.opts.query &&
        this.$socket.io.opts.query.id != this.$socket.id
      ) {
        this.status = `query.id: ${this.$socket.io.opts.query.id} socket.id: ${this.$socket.id}`;
        this.$socket.disconnect(true);
        this.dialog = true;
        return;
      }

      // ignore any non-Visitor sockets
      if (!this.$socket.io.opts.query || this.$socket.io.opts.query.id == '') {
        console.log(
          highlight(
            `Inside connect(), but disconnecting non-LCT socket ${this.$socket.idt}`
          )
        );
        this.$socket.disconnect(true);
        return;
      }

      const { visitor, id, nsp } = this.$socket.io.opts.query;
      console.group('onConnect');
      console.log(`Connecting ${visitor}`);

      this.log(
        `Server connected using Id: ${id}, Visitor: ${visitor}, and nsp ${nsp} `,
        'visitorIdentityCard.vue'
      );
      console.groupEnd();

      // cache last Room used
      State.changeVisitorId(id);
      // set icon to indicate connect() handled
      this.statusIcon = 'mdi-lan-connect';
      this.hint = this.selectedVisitor.id;
      this.$emit('visitor', this.selectedVisitor);
    },

    reconnect(reason) {
      console.group('onReconnect');
      console.log(
        highlight(
          `[${getNow()}] ${printJson(
            this.$socket.io.opts.query
          )} Recconnect ${reason}`,
          'visitorIdentityCard.vue'
        )
      );
      const msg = {
        visitor: this.$socket.io.opts.query.visitor,
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
    connectToServer() {
      this.dialog = false;
      this.$socket.io.opts.query = {
        visitor: this.selectedVisitor.visitor,
        id: this.selectedVisitor.id,
        nsp: '',
      };

      this.$socket.connect();
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
          this.onVisitorSelected('updateVisitor');
          this.newVisitor = false;
        })
        .catch((e) => console.log(e));
    },

    onVisitorSelected(caller) {
      console.log(highlight(`Step 4: onVisitorSelected ${caller}`));

      try {
        this.reconnected = false;

        if (this.$socket.connected) {
          console.log(`${this.$socket.io.opts.query.visitor} is  connected`);
          // is this a newly selected visitor?
          if (
            this.$socket.io.opts.query.visitor == this.selectedVisitor.visitor
          ) {
            // if client and server are in sync, no need for further actions
            return;
          }

          console.log(
            `${this.selectedVisitor.visitor} is not connected yet. Disconnecting previous Visitor, ${this.$socket.io.opts.query.visitor}`
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
        console.log(
          'Called connect(). Leaving onVisitorSelected() at ',
          Date.now()
        );
      } catch (error) {
        console.error('onVisitorSelected:', error);
      }
    },

    selectedVisitorInit() {
      console.log(highlight('Step 2: selectedVisitorInit'));

      let id = State.find(0)?.visitorId;
      let v = this.findVisitorWithId(id);
      if (v) {
        // setting selectedVisitor will trigger watch that calls onVisitorSelected that connects to Server
        this.selectedVisitor = v;
      } else {
        this.selectedVisitor = { room: '', id: '' };
        this.newVisitor = true;
      }
      this.dialog = this.$socket.disconnected;
    },
  },
  watch: {
    selectedVisitor(newVal, oldVal) {
      console.group('Step 3: selectedRoom watch');
      console.log(
        highlight(this.$socket.id, this.$socket.connected, this.$socket.io.opts)
      );
      console.groupEnd();
      console.log(' ');

      if (!newVal) {
        this.deleteVisitor(oldVal);
        return;
      }

      if (!this.selectedVisitor) {
        this.selectedVisitor = { visitor: '', id: '' };
      }

      this.onVisitorSelected('watch');
    },
  },

  created() {
    console.group('Step -1: created()');
    console.log(
      highlight(this.$socket.id, this.$socket.connected, this.$socket.io.opts)
    );
    console.groupEnd();
    console.log(' ');
  },

  async mounted() {
    await State.$fetch();
    await Visitor.$fetch();

    console.group('Step 1: mounted()');
    console.log(
      highlight(this.$socket.id, this.$socket.connected, this.$socket.io.opts)
    );
    console.groupEnd();
    console.log(' ');
    this.selectedVisitorInit();
  },
};
</script>
