<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <!-- src="@/assets/soteriaLogoCovidRed.jpg" 
                              width="40"
-->

      <div class="d-flex align-left">
        <v-btn class="pl-0" text to="/home">
          <v-img
            alt="Enduring Net Logo"
            class="shrink "
            contain
            src="@/assets/Enduring-Net-Logo-Portrait-Purple-RGB-BG.png"
            max-height="36"
            max-width="75"
        /></v-btn>
        <!-- <soteria-icon /> -->
      </div>

      <v-spacer></v-spacer>
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
import update from '@/mixins/update.js';

export default {
  name: 'App',

  components: {},
  computed: {},
  data: () => ({
    rating: 3,
    links: [
      {
        label: 'Admin',
        url: '/admin',
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
  mixins: [update],
};
</script>
