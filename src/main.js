import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import VueSocketIO from 'vue-socket.io';
import SocketIO from 'socket.io-client';
import config from '@/config.json';

import SoteriaIcon from './components/svg/SoteriaLogo.vue';
Vue.component('soteria-icon', SoteriaIcon);

Vue.config.productionTip = false;

let local = false;
let url = local ? config.ioServerUrl : config.ngrokUrlUbuntu;
console.log('url:', url);

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: SocketIO(url),
  })
);
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
