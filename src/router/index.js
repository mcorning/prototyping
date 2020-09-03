import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Visitor from '@/components/Visitor.vue';
import Room from '@/components/Room.vue';
// import State from '@/models/State';

Vue.use(VueRouter);

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
    component: Home,
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
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
    component: Visitor,
  },
  {
    path: '/room',
    name: 'Room',
    component: Room,
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
