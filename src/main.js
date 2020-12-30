import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import VueSocketIO from 'vue-socket.io';
import config from '@/config.json';
import Room from '@/models/Room';

// import { ErrorService } from './ErrorService.js';

import SoteriaIcon from './components/svg/SoteriaLogo.vue';
Vue.component('soteria-icon', SoteriaIcon);
Vue.config.productionTip = false;

let url =
  process.env.NODE_ENV == 'development'
    ? config.ioServerUrl
    : config.ngrokUrlUbuntu;

Room.$fetch().then(() => {
  console.log('---------------main.js-----------------------');

  const room = Room.query().first();
  url += `?room=${room ? room.room : ''}&id=${room ? room.id : ''}&nsp=`;
  console.log('url:', url);
  console.log(process.env.NODE_ENV);
  console.log('--------------------------------------------');
  Vue.use(
    new VueSocketIO({
      debug: true,
      connection: url,
      // we assign a query with the id we generate so socket.io server will defer to that for the new socket.id
      autoConnect: false,
    })
  );

  // Vue.config.errorHandler = (error) => ErrorService.onError(error);
  Vue.prototype.$showDetails = false;
  new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
  }).$mount('#app');
});
