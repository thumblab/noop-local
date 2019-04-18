import Vue from 'vue'
import Vuex from 'vuex'

import app from './modules/app'
import components from './modules/components'
import resources from './modules/resources'
import changes from './modules/changes'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    app,
    components,
    resources,
    changes
  }
})
