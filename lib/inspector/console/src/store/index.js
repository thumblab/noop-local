import Vue from 'vue'
import Vuex from 'vuex'

import components from './modules/components'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    components
  }
})
