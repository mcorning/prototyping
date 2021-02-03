import { devUrl, prodUrl } from '@/config.json';
import './registerServiceWorker';
// import { ErrorService } from './ErrorService.js';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import VueSocketIO from 'vue-socket.io';

// careful reads at
// https://socket.io/docs/v3/client-api/#io-url-options
// and
// github.com/MetinSeylan/Vue-Socket.io
// make it clear how to use options instead of hardwiring query in the connection string
// (which precludes socket reuse with different query options)

// To use socket.io-client (instead of vue-socekt.io instance):
// import SocketIO from 'socket.io-client';
// then use that object with a connection string and an options object:
// Vue.use(
//   new VueSocketIO({
//     debug: false,
//     connection: -------> SocketIO(url, options), <-------
//     autoConnect: false,
//   })
// );

import SoteriaIcon from './components/svg/safeInSistersLogo.vue';

import Visitor from '@/models/Visitor';

const nullVisitor = { visitor: '', id: '', nsp: '' };

let url = process.env.NODE_ENV == 'development' ? devUrl : prodUrl;

Visitor.$fetch().then(() => {
  console.log('---------------main.js-----------------------');

  const lastVisitor = Visitor.query()
    .orderBy('lastVisit', 'desc')
    .first();

  const { visitor, id, nsp } = lastVisitor ? lastVisitor : nullVisitor;
  const options = {
    query: { visitor: visitor, id: id, nsp: nsp },
  };
  console.log('url:', url);
  console.log('options:', options);
  console.log(process.env.NODE_ENV);
  console.log('--------------------------------------------');

  Vue.component('soteria-icon', SoteriaIcon);

  Vue.config.productionTip = false;

  Vue.use(
    new VueSocketIO({
      debug: false,
      connection: url,
      options: options,
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
