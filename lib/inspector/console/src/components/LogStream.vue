<template>
  <b-list-group flush class="scroll" ref="scroller">
      <b-list-group-item v-for="log in logs" v-bind:key="log.id">
        <b-badge variant="dark">{{log.time.format('hh:mm:ss.SSS')}}</b-badge> {{log.data}}
      </b-list-group-item>
  </b-list-group>
</template>

<script>
import { baseUrl } from '@/api'
import moment from 'moment'

export default {
  props: ['path'],
  data () {
    return {
      connected: false,
      logs: []
    }
  },
  created () {
    this.stream()
  },
  methods: {
    stream () {
      const url = `${baseUrl}${this.path}`.replace('http:', 'ws:')
      const ws = new WebSocket(url)
      console.log(`Connecting to component logs websocket ${url}`)
      ws.onopen = () => {
        this.connected = true
      }
      ws.onclose = () => {
        this.connected = false
      }
      ws.onerror = (err) => {
        console.error(err)
        this.connected = false
      }
      ws.onmessage = (msg) => {
        let payload
        try {
          payload = JSON.parse(msg.data)
        } catch (err) {
          return console.error('WS msg parse error', err)
        }
        payload = payload.map((log) => {
          log.id = new Buffer(log.time+log.data).toString('hex').substring(0, 64)
          log.time = new moment(log.time)
          return log
        })
        this.logs = this.logs.concat(payload).sort((a, b) => {
          return a.time > b.time
        })
        setTimeout(() => {
          this.$refs.scroller.scrollTop = this.$refs.scroller.scrollHeight
        }, 50)
      }
    }
  }
}
</script>

<style>
.scroll {
  overflow-y: scroll;
}
</style>
