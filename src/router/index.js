import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Visitor from '@/components/Visitor.vue';
// import Room from '@/components/Room.vue';
// import Admin from '@/components/Admin.vue';
// import State from '@/models/State';

Vue.use(VueRouter);

// TODO can you fix this now?
//
// this fails, and i don't know how to fix it
// resorting to manual override
// async function getDefaultVue() {
//   let fetched = await State.$fetch();
//   if (fetched.state?.length) {
//     let state = fetched.state[0];
//     return state.defaultVue;
//   }
// }

const routes = [
  {
    path: '/',
    name: 'Root',
    component: Visitor,
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () =>
      import(/* webpackChunkName: "admin" */ '@/components/Admin.vue'),
  },
  // {
  //   path: '/',
  //   redirect: 'visitor',
  //   // redirect: getDefaultVue(),
  //   name: 'redir',
  //   component: Home,
  // },
  {
    path: '/visitor',
    name: 'Visitor',
    component: () =>
      import(/* webpackChunkName: "visitor" */ '@/components/Visitor.vue'),
  },
  {
    path: '/room',
    name: 'Room',
    component: () =>
      import(/* webpackChunkName: "room" */ '@/components/Room.vue'),
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});
export default router;
