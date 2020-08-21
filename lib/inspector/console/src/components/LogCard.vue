<template>
  <b-card no-body class="text-left logs-card">
    <template slot="header">
      Logs <b-badge variant="success">live</b-badge>
      <div class="float-right">
        <b-form inline>
          <b-form-checkbox v-model="simple" size="sm">Simple View</b-form-checkbox>
          <b-form-input class="ml-2" size="sm" id="filter" v-model="filter" placeholder="filter" />
        </b-form>
      </div>
    </template>
    <div v-if="simple" class="simple">
      <div v-for="log in logs" v-bind:key="log.id" :title="log.time.format('hh:mm:ss.SSS')">
        {{log.data}}
      </div>
    </div>
    <b-list-group v-else flush class="scroll fullwidth" ref="scroller">
      <b-list-group-item v-for="log in logs" v-bind:key="log.id">
        <div v-if="log.json">
          <LogTreeItem :log="log" />
        </div>
        <div v-else>
          <b-badge variant="dark">{{log.time.format('hh:mm:ss.SSS')}}</b-badge> {{log.data}}
        </div>
      </b-list-group-item>
    </b-list-group>
  </b-card>
</template>

<script>
import { baseUrl } from '../api'
import moment from 'moment'
import LogTreeItem from './LogTreeItem.vue'

export default {
  props: ['path'],
  components: {
    LogTreeItem
  },
  data () {
    return {
      connected: false,
      logs: [],
      ws: null,
      simple: false,
      filter: ''
    }
  },
  created () {
    this.stream()
  },
  methods: {
    stream () {
      const url = `${baseUrl}${this.path}`.replace('http:', 'ws:')
      this.ws = new WebSocket(url)
      console.log(`Connecting to component logs websocket ${url}`)
      this.ws.onopen = () => {
        this.connected = true
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
        payload = payload.map((log) => {
          log.id = new Buffer(log.time+log.data).toString('hex').substring(0, 64)
          log.time = new moment(log.time)
          if (/^\{.+\}$/.test(log.data)) {
            try {
              log.json = JSON.parse(log.data)
            } catch (err) {
              // do nothing
            }
          }
          return log
        })
        this.logs = this.logs.concat(payload).sort((a, b) => {
          return a.time > b.time
        })
        setTimeout(() => {
          if (this.$refs.scroller)
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

.logs-card {
  flex-grow: 1;
}

.logs-card .list-group {
  font-family: "Lucida Console", Monaco, monospace;
  font-size: 0.8em;
}

.logs-card .list-group-item {
  padding: 4px 10px;
}

.limit {
  max-height: 50%
}

.simple {
  margin: 12px;
  overflow: scroll;
  white-space: nowrap;
  height: 100%;
  font-family: "Lucida Console", Monaco, monospace;
  font-size: 0.8em;
}

.fullwidth {
  width: 100%;
}
</style>
