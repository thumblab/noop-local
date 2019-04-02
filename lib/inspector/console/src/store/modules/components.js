import { request } from '@/api'

const state = { data: [], loading: false }

const getters = {
  byEnv: (state) => (envId) => {
    return state.data.filter((item) => item.id.indexOf(envId) === 0)
  },
  getById: (state) => (componentId) => {
    return state.data.find((item) => item.id === componentId)
  }
}

const actions = {
  loadByEnv ({ commit }, envId) {
    if (this.state.components.loading) return false
    commit('setLoading', true)
    request.get(`${envId}/components`)
      .then(res => {
        commit('setComponent', res.data)
        commit('setLoading', false)
      })
      .catch((err) => {
        commit('setLoading', false, err)
      })
  }
}

const mutations = {
  setComponent (state, components) {
    if (!Array.isArray(components)) components = [components]
    components.forEach((component) => {
      const existingIndex = state.data.findIndex((existing) => existing.id === component.id)
      if (existingIndex !== -1) {
        state.data.splice(existingIndex, 1, component)
      } else {
        state.data.push(component)
      }
    })
  },
  setLoading (state, loading) {
    state.loading = loading
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
