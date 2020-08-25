const WebSocket = require('ws')
const Events = require('events')

class RouterInterface extends Events.EventEmitter {
  constructor (devServer) {
    super()
    this.devServer = devServer
    this.state = {}
    this.port = devServer.port + 2
  }

  start (done) {
    setTimeout(() => {
      this.ws = new WebSocket(`ws://localhost:${this.port}/_noop`)
      this.ws.on('message', (data) => {
        this.handleUpdate(data)
      })
      this.ws.once('open', done)
      this.ws.on('error', (err) => console.error('router interface error', err))
    }, 1000)
  }

  handleUpdate (data) {
    try {
      const payload = JSON.parse(data)
      if (!this.state[payload.id]) this.state[payload.id] = {}
      Object.keys(payload).forEach((key) => {
        this.state[payload.id][key] = payload[key]
      })
      this.emit('change', payload)
    } catch (err) {
      console.error('router interface payload error', err)
    }
  }
}

module.exports = RouterInterface
