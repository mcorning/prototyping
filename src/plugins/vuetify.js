import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import colors from 'vuetify/lib/util/colors';

Vue.use(Vuetify);
let color = 'purple';
export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors[color].darken2,
        secondary: colors[color].lighten3,
        accent: colors.shades.black,
        error: colors.red.accent3,
      },
      dark: {
        primary: colors.blue.lighten3,
      },
    },
  },
});
