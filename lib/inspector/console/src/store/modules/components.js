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
    request.get('/components')
      .then(res => {
        commit('setData', res.data)
      })
  },
  byId ({ commit }, id) {
    request.get(`/components/${id}`)
      .then(res => {
        const component = res.data
        request.get(`/components/${id}/variables`)
          .then(res => {
            component.variables = res.data
            commit('setData', component)
          })
      })
  },
  putVariable ({ commit }, req) {
    request.put(`/components/${req.id}/variables/${req.key}`, { value: req.value })
      .then(res => {
        actions.byId({ commit }, req.id)
      })
  },
  removeVariable ({ commit }, req) {
    request.delete(`/components/${req.id}/variables/${req.key}`)
      .then(res => {
        actions.byId({ commit }, req.id)
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
