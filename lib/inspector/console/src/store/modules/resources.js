import { request } from '../../api'

const state = { data: [] }

const getters = {
  list: (state) => () => {
    return state.data
  },
  byId: (state) => (id) => {
    return state.data.find((item) => item.id === id)
  }
}

const actions = {
  list ({ commit }) {
    request.get('/resources')
      .then(res => {
        commit('setData', res.data)
      })
  },
  byId ({ commit }, id) {
    request.get(`/resources/${id}`)
      .then(res => {
        commit('setData', res.data)
      })
  }
}

const mutations = {
  setData (state, items) {
    if (!Array.isArray(items)) items = [items]
    items.forEach((item) => {
      const existingIndex = state.data.findIndex((existing) => existing.id === item.id)
      if (existingIndex !== -1) {
        state.data.splice(existingIndex, 1, item)
      } else {
        state.data.push(item)
      }
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
