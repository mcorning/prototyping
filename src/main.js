Vue.prototype.$build = '11.10.12.46';
let local = true; // as soon as local changes to true, the server will start responding

import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import VueSocketIO from 'vue-socket.io';
// import SocketIO from 'socket.io-client';
import config from '@/config.json';

import SoteriaIcon from './components/svg/SoteriaLogo.vue';
Vue.component('soteria-icon', SoteriaIcon);

Vue.config.productionTip = false;

let url = local ? config.ioServerUrl : config.ngrokUrlUbuntu;
console.log('url:', url);

Vue.use(
  new VueSocketIO({
    debug: true,
    // connection: SocketIO(url),
    connection: url,
    autoConnect: false,
  })
);
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
