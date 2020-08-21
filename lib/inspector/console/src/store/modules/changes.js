import { baseUrl } from '../../api'

const state = { connected: false }

const getters = {
  connected: (state) => () => {
    return state.connected
  }
}

const actions = {
  listen ({ commit }) {
    const url = `${baseUrl}/changes`.replace('http:', 'ws:')
    console.log(`Connecting to inspector websocket ${url}`)
    const ws = new WebSocket(url)
    ws.onopen = () => {
      commit('setConnected', true)
    }
    ws.onclose = () => {
      commit('setConnected', false)
    }
    ws.onerror = (err) => {
      console.error(err)
      commit('setConnected', false)
    }
    ws.onmessage = (data) => {
      let payload
      try {
        payload = JSON.parse(data)
      } catch (err) {
        console.error('WS msg parse error', err)
      }
      // do something with payload
      console.log(payload)
    }
  }
}

const mutations = {
  setConnected (state, connected) {
    state.connected = connected
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
