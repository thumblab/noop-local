<template>
  <div ref="terminal"></div>
</template>

<script>
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import { baseUrl } from '@/api'

export default {
  data () {
    const url = `${baseUrl}/components/${this.$route.params.componentId}/terminal`.replace('http:', 'ws:')
    const ws = new WebSocket(url)
    console.log(`Connecting to component terminal websocket ${url}`)
    Terminal.applyAddon(fit)
    const terminal = new Terminal()
    return {
      terminal,
      ws,
      connected: false
    }
  },
  mounted () {
    const element = this.$refs.terminal
    this.terminal.open(element)
    this.terminal.fit()
    this.terminal.on('data', (data) => {
      const payload = new Buffer(data).toString('base64')
      this.ws.send(JSON.stringify({d: payload}))
    })
    this.ws.onopen = () => {
      this.connected = true
      this.ws.send(JSON.stringify({
        w: this.terminal.cols,
        h: this.terminal.rows
      }))
    }
    this.ws.onclose = () => {
      this.connected = false
    }
    this.ws.onerror = (err) => {
      console.error(err)
      this.connected = false
    }
    this.ws.onmessage = (msg) => {
      let payload
      try {
        payload = JSON.parse(msg.data)
      } catch (err) {
        return console.error('WS msg parse error', err)
      }
      this.terminal.write(new Buffer(payload.d, 'base64').toString())
    }
  }
}
</script>

<style>

</style>
