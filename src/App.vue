<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <!-- src="@/assets/soteriaLogoCovidRed.jpg" 
                              width="40"
-->

      <div class="d-flex align-left">
        <v-btn text to="/admin">
          <v-img
            alt="Enduring Net Logo"
            class="shrink mr-2"
            contain
            src="@/assets/Enduring-Net-Logo-Vertical-Purple-RGB-BG.png"
            max-width="100"
        /></v-btn>
        <!-- <soteria-icon /> -->
      </div>

      <v-spacer></v-spacer>
      <v-btn
        v-for="link in links"
        :key="`${link.label}-header-link`"
        text
        rounded
        :to="link.url"
        >{{ link.label }}</v-btn
      >
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-footer color="primary lighten-1" padless>
      <v-layout justify-center wrap align-center>
        <v-btn
          v-for="link in links"
          :key="`${link.label}-footer-link`"
          color="white"
          text
          rounded
          class="mx-2"
          :to="link.url"
          >{{ link.label }}</v-btn
        >
        <!-- <v-btn v-if="image" height="0" width="0" to="/profile">
          <v-avatar min-width="30" width="30" height="30">
            <v-img :src="image" alt="Me"></v-img> </v-avatar
        ></v-btn> -->

        <!-- <v-btn to="/profile" color="white" text rounded> Track</v-btn> -->
        <v-flex
          prepend-icon="mdi-tm"
          primary
          lighten-2
          py-2
          text-center
          white--text
          xs12
        >
          <v-row no-gutters justify="space-between">
            <v-col>
              <small> Patron: <strong>Secours.io</strong></small>
            </v-col>
            <v-col>
              <small>Build {{ $build }}</small>
            </v-col>

            <v-col cols="auto">
              <small>{{ shipString }}</small>
            </v-col>

            <v-col>
              <small>
                &copy; {{ new Date().getFullYear() }} —
                <strong>Soteria.id</strong></small
              >
            </v-col>
          </v-row>
        </v-flex>
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script>
import moment from 'moment';
export default {
  name: 'App',

  components: {},
  computed: {
    shipString() {
      return moment(this.ver, 'MM.DD.hh.mm');
    },
  },
  data: () => ({
    rating: 3,
    links: [
      {
        label: 'Home',
        url: '/home',
      },
      {
        label: 'Room',
        url: '/room',
      },
      {
        label: 'Visitor',
        url: '/visitor',
      },
    ],
  }),
};
</script>
