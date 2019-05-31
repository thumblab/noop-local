<template>
  <b-card no-body class="text-left terminal-card">
    <template slot="header">
      Debug Terminal
      <span class="float-right pointer" v-on:click="connect">
        <icon icon="sync"/>
      </span>
    </template>
    <div ref="terminal" class="terminal"></div>
  </b-card>
</template>

<script>
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import { baseUrl } from '@/api'
Terminal.applyAddon(fit)

export default {
  data () {
    return {
      terminal: null,
      ws: null,
      connected: false,
      height: 0,
      width: 0
    }
  },
  created () {
    window.addEventListener('resize', this.handleResize)
  },
  destroyed () {
    this.ws.close()
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    connect () {
      if (this.terminal) this.terminal.destroy()
      this.terminal = new Terminal({rows: 16})
      const element = this.$refs.terminal
      this.terminal.open(element)
      this.terminal.on('data', (data) => {
        const payload = new Buffer(data).toString('base64')
        this.ws.send(JSON.stringify({ d: payload }))
      })
      const url = `${baseUrl}/components/${this.$route.params.componentId}/terminal`.replace('http:', 'ws:')
      this.ws = new WebSocket(url)
      console.log(`Connecting to component terminal websocket ${url}`)
      this.ws.onopen = () => {
        this.connected = true
        this.handleResize()
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
    },
    handleResize () {
      this.terminal.fit()
      const w = this.terminal.cols
      const h = this.terminal.rows
      if (w === this.width && h === this.height) return null
      this.width = w
      this.height = h
      this.ws.send(JSON.stringify({w, h}))
    }
  },
  mounted () {
    this.connect()
  }
}
</script>

<style>
.terminal {
  padding: 6px;
  background-color: black;
}

.terminal-card {
  flex-grow: 1;
}

.pointer {
  cursor: pointer;
}
</style>
