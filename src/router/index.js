import config from '@/config.json';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Visitor from '@/components/Visitor.vue';
import Room from '@/components/Room.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Visitor,
  },
  {
    path: '/',
    // redirect: 'visitor',
    redirect: config.defaultVue,
    name: 'redir',
    component: Home,
  },
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
