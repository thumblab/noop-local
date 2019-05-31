import { baseUrl } from '@/api'

const state = { data: [], connected: false }

const getters = {
  connected: (state) => () => {
    return state.connected
  },
  list: (state) => () => {
    return state.data.sort((a, b) => {
      if (a.id < b.id) return 1
      if (a.id > b.id) return -1
      return 0
    })
  },
  byId: (state) => (id) => {
    return state.data.find((request) => {
      return (request.id === parseInt(id))
    })
  }
}

const actions = {
  listen ({ commit }) {
    if (this.connected) return false
    const url = `${baseUrl}/traffic`
    this.source = new EventSource(url)
    this.source.onopen = () => {
      commit('setConnected', true)
    }
    this.source.onclose = () => {
      commit('setConnected', false)
    }
    this.source.onerror = (err) => {
      console.error(err)
      commit('setConnected', false)
    }
    this.source.onmessage = (msg) => {
      let payload
      try {
        payload = JSON.parse(msg.data)
      } catch (err) {
        console.error('traffic msg parse error', err)
      }
      commit('setData', payload)
    }
  }
}

const mutations = {
  setConnected (state, connected) {
    state.connected = connected
  },
  setData (state, items) {
    if (!Array.isArray(items)) items = [items]
    items.forEach((item) => {
      const existingIndex = state.data.findIndex((existing) => existing.id === item.id)
      if (existingIndex !== -1) {
        Object.keys(item).forEach((key) => {
          state.data[existingIndex][key] = item[key]
        })
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
