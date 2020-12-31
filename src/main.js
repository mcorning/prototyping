import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import VueSocketIO from 'vue-socket.io';
import config from '@/config.json';

// import { ErrorService } from './ErrorService.js';

import SoteriaIcon from './components/svg/SoteriaLogo.vue';

import Visitor from '@/models/Visitor';

Vue.component('soteria-icon', SoteriaIcon);

Vue.config.productionTip = false;

const nullVisitor = { visitor: '', id: '', nsp: '' };

let url =
  process.env.NODE_ENV == 'development'
    ? config.ioServerUrl
    : config.ngrokUrlUbuntu;

Visitor.$fetch().then(() => {
  console.log('---------------main.js-----------------------');

  const lastVisitor = Visitor.query()
    .orderBy('lastVisit')
    .first();

  // const { visitor, id, nsp } = lastVisitor ? lastVisitor : nullVisitor;
  // url += `?visitor=${visitor}&id=${id}&nsp=${nsp}`;

  console.log('url:', url);
  console.log('query:', lastVisitor || nullVisitor);
  console.log(process.env.NODE_ENV);
  console.log('--------------------------------------------');

  Vue.use(
    new VueSocketIO({
      debug: false,
      connection: url,
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
