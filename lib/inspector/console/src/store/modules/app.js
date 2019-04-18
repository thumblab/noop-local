import { request } from '@/api'

const state = { data: {} }

const getters = {
  get: (state) => () => {
    return state.data
  }
}

const actions = {
  get ({ commit }) {
    request.get('/app')
      .then(res => {
        commit('setData', res.data)
      })
  }
}

const mutations = {
  setData (state, app) {
    state.data = app
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
