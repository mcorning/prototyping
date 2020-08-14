<template>
  <v-container>
    <v-card dark>
      <v-card-text
        ><v-text-field label="Your ID" v-model="yourId"></v-text-field>
        <v-text-field label="Room ID" v-model="roomId"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="checkin">Checkin</v-btn>
        <v-btn @click="checkin">Alert Rooms</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import io from 'socket.io-client';
const socket = io('http://localhost:3000');

export default {
  name: 'HelloWorld',

  data: () => ({
    yourId: '',
    roomId: '',
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
    checkin() {
      socket.emit('new message', {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Check-in',
        sentTime: new Date().toISOString(),
      });
    },
    alertRooms() {
      socket.emit('new message', {
        visitor: this.yourId,
        room: this.roomId,
        message: 'Alert',
        sentTime: new Date().toISOString(),
      });
    },
  },
  created() {
    socket.emit('add user', 'Visitor');
  },
};
</script>
