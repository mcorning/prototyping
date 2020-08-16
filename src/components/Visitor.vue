<template>
  <v-container>
    <v-card dark>
      <v-card-title>Your Travel Diary</v-card-title>
      <v-card-subtitle
        >Record each you visit. If you go into quarantine, Alert
        Rooms</v-card-subtitle
      >
      <v-card-text
        ><v-text-field label="Your ID" v-model="yourId"></v-text-field>
        <v-text-field label="Room ID" v-model="roomId"></v-text-field>
      </v-card-text>
      <v-card-text>
        <v-list dense>
          <v-subheader>Visits</v-subheader>
          <v-list-item-group v-model="visits" color="primary">
            <v-list-item v-for="(name, i) in messages" :key="i">
              <v-list-item-icon>
                <v-icon>mdi-account-check</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="name.room"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="checkin">Checkin</v-btn>
        <v-btn @click="alertRooms">Alert Rooms</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import io from 'socket.io-client';
const socket = io('http://localhost:3000');
socket.on('alert', (msg) => {
  alert(msg);
});

export default {
  name: 'LctVisitor',
  computed: {
    visits() {
      return this.messages.length;
    },
  },

  data: () => ({
    messages: [],
    yourId: 'Tao',
    roomId: 'Home',
    importantLinks: [
      {
        text: 'Documentation',
        href: 'https://vuetifyjs.com',
      },
      {
        text: 'Chat',
        href: 'https://community.vuetifyjs.com',
      },
      {
        text: 'Made with Vuetify',
        href: 'https://madewithvuejs.com/vuetify',
      },
      {
        text: 'Twitter',
        href: 'https://twitter.com/vuetifyjs',
      },
      {
        text: 'Articles',
        href: 'https://medium.com/vuetify',
      },
    ],
    whatsNext: [
      {
        text: 'Explore components',
        href: 'https://vuetifyjs.com/components/api-explorer',
      },
      {
        text: 'Select a layout',
        href: 'https://vuetifyjs.com/getting-started/pre-made-layouts',
      },
      {
        text: 'Frequently Asked Questions',
        href:
          'https://vuetifyjs.com/getting-started/frequently-asked-questions',
      },
    ],
  }),
  methods: {
    handleMessage(msg) {
      this.messages.push(msg);
      if (msg.message == 'Alert') {
        alert(msg);
      }
    },
    checkin() {
      let msg = {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Check-in',
        sentTime: new Date().toISOString(),
      };
      this.messages.push(msg);

      socket.emit('new message', msg);
    },
    alertRooms() {
      socket.emit('new message', {
        visitor: this.yourId,
        room: this.roomId,
        message: 'alert',
        sentTime: new Date().toISOString(),
      });
    },
  },
  created() {
    socket.emit('add user', 'Visitor');
    socket.on('new message', (msg) => this.handleMessage(msg));
  },
};
</script>
