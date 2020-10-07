import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'xterm/css/xterm.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faLink, faExclamationTriangle, faDatabase, faTrafficLight, faServer, faPowerOff, faSync, faGlobe, faCode, faTrashAlt, faTerminal, faTimesCircle, faPlusCircle, faHistory, faBook, faRedo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const icons = [faLink, faExclamationTriangle, faDatabase, faTrafficLight, faServer, faPowerOff, faSync, faGlobe, faCode, faTrashAlt, faTerminal, faTimesCircle, faPlusCircle, faHistory, faBook, faRedo]
icons.forEach((icon) => {
  library.add(icon)
})
Vue.component('icon', FontAwesomeIcon)

Vue.use(BootstrapVue)

Vue.config.productionTip = false
// Vue.config.devtools = true

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
