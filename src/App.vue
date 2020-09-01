<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <!-- src="@/assets/soteriaLogoCovidRed.jpg" 
                              width="40"
-->

      <div class="d-flex align-center">
        <v-img
          alt="Enduring Net Logo"
          class="shrink mr-2"
          contain
          src="@/assets/Enduring-Net-Logo-Vertical-Purple-RGB-BG.png"
          max-width="120"
        />
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
  </v-app>
</template>

<script>
export default {
  name: 'App',

  components: {},

  data: () => ({
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
