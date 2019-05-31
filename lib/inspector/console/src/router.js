import Vue from 'vue'
import Router from 'vue-router'

import Home from './pages/Home.vue'
import Component from './pages/Component.vue'
import Resource from './pages/Resource.vue'
import Traffic from './pages/Traffic.vue'
import Explorer from './pages/Explorer.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/components/:componentId',
      name: 'component',
      component: Component
    },
    {
      path: '/resources/:resourceId',
      name: 'resource',
      component: Resource
    },
    {
      path: '/traffic/:requestId',
      name: 'traffic',
      component: Traffic
    },
    {
      path: '/explorer',
      name: 'explorer',
      component: Explorer
    }
  ]
})
