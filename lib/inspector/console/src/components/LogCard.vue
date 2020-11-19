<template>
  <b-card no-body class="text-left logs-card">
    <template slot="header">
      Logs <b-badge variant="success">live</b-badge>
      <div class="float-right">
        <b-form inline v-on:submit.prevent>
          <b-form-checkbox v-model="simple" size="sm">Simple View</b-form-checkbox>
          <b-form-input class="ml-2" size="sm" id="filter" v-model="filter" placeholder="filter" />
        </b-form>
      </div>
    </template>
    <div v-if="simple" class="simple">
      <div v-for="log in filteredLogs" v-bind:key="log.id" :title="log.time" class="pre-wrap">
        {{log.data}}
      </div>
    </div>
    <b-list-group v-else flush class="scroll fullwidth" ref="scroller">
      <b-list-group-item v-for="log in filteredLogs" v-bind:key="log.id">
        <div v-if="log.json">
          <LogTreeItem :log="log" />
        </div>
        <div v-else class="pre-wrap">
          <b-badge variant="dark">{{log.time}}</b-badge> {{log.data}}
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
      newLogs: [],
      interval: null,
      ws: null,
      simple: false,
      filter: '',
      scroll: false
    }
  },
  computed: {
    filteredLogs () {
      const filter = (logs, filter) => logs.filter(log => !!log.json || log.data.toLowerCase().includes(filter.toLowerCase()))
      return filter(this.logs, this.filter)
    }
  },
  created () {
    this.stream()
  },
  mounted () {
    this.interval = setInterval(() => {
      if (this.newLogs.length) {
        if (this.logs.length + this.newLogs.length > 1000) {
          this.logs.splice(0, this.logs.length + this.newLogs.length - 1000)
        }
        if (this.newLogs.length > 1000) {
          this.logs.push(...this.newLogs.splice(this.newLogs.length - 1000, 1000))
        } else {
          this.logs.push(...this.newLogs.splice(0, this.newLogs.length))
        }
        if (this.$refs.scroller) this.scroll = true
      }
    }, 2000)
  },
  updated () {
    if (this.scroll && this.$refs.scroller) {
      this.$refs.scroller.scrollTop = this.$refs.scroller.scrollHeight
    }
    this.scroll = false
  },
  beforeDestroy () {
    clearInterval(this.interval)
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
        const formatLog = (log) => {
          if (!log.data.trim()) return false
          log.id = Buffer.from(log.time + log.data).toString('hex').substring(0, 64)
          log.time = moment(log.time).format('hh:mm:ss.SSS')
          log.data = log.data.trim()
          if (/^\{.+\}$/.test(log.data)) {
            try {
              log.json = JSON.parse(log.data)
            } catch (err) {
              // do nothing
            }
          }
          return log
        }
        if (Array.isArray(payload)) {
          payload = payload.map((log) => formatLog(log)).filter(Boolean)
          this.logs = payload
          if (this.$refs.scroller) this.scroll = true
        } else if (payload.data.trim()) {
          if (this.newLogs.length >= 1000) {
            this.newLogs.splice(0, this.logs.length - 999)
          }
          this.newLogs.push(formatLog(payload))
        }
      }
    }
  }
}
</script>

<style>
.scroll, .logs-card {
  overflow-y: scroll;
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

.pre-wrap {
  white-space: pre-wrap;
}
</style>
