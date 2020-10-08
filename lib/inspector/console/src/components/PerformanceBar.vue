<template>
  <b-button-group v-if="perf && (perf.cpu_percent === 0 || perf.cpu_percent > 0)">
    <b-button variant="dark" >
      CPU <b-badge>{{perf.cpu_percent}}%</b-badge>
    </b-button>
    <b-dropdown variant="dark" no-caret>
      <template v-slot:button-content>Memory <b-badge>{{perf.memory_percent}}%</b-badge></template>
      <b-dropdown-item>Usage {{perf.memory_usage}}</b-dropdown-item>
      <b-dropdown-item>Limit {{perf.memory_limit}}</b-dropdown-item>
      <b-dropdown-item>Max {{perf.memory_max}}</b-dropdown-item>
    </b-dropdown>
    <b-button variant="dark">
      Network <b-badge>{{perf.networkRx}}/s in</b-badge>&nbsp;<b-badge>{{perf.networkTx}}/s out</b-badge>
    </b-button>
  </b-button-group>
</template>

<script>
import { baseUrl } from '../api'
import prettysize from 'prettysize'

export default {
  props: ['path'],
  data () {
    return {
      connected: false,
      perf: null,
      source: null,
      lastNetworkRx: 0,
      lastNetworkTx: 0
    }
  },
  created () {
    this.stream()
  },
  destroyed () {
    this.source.close()
  },
  methods: {
    stream () {
      const url = `${baseUrl}${this.path}`
      this.source = new EventSource(url)
      this.source.onopen = () => {
        this.connected = true
      }
      this.source.onclose = () => {
        this.connected = false
      }
      this.source.onerror = (err) => {
        console.error(err)
        this.connected = false
      }
      this.source.onmessage = (msg) => {
        let payload
        try {
          payload = JSON.parse(msg.data)
        } catch (err) {
          return console.error('msg parse error', err)
        }

        // cpu
        const cpuDelta = payload.cpu_stats.cpu_usage.total_usage - payload.precpu_stats.cpu_usage.total_usage
        const availableCpu = payload.cpu_stats.system_cpu_usage
        payload.cpu_percent = Math.ceil((cpuDelta / availableCpu) * 100) / 10

        // memory
        payload.memory_percent = Math.ceil((payload.memory_stats.usage / payload.memory_stats.limit) * 1000) / 10
        payload.memory_usage = prettysize(payload.memory_stats.usage)
        payload.memory_limit = prettysize(payload.memory_stats.limit)
        payload.memory_max = prettysize(payload.memory_stats.max_usage)

        // network
        let networkRx = 0
        let networkTx = 0
        if (payload.networks) {
          Object.keys(payload.networks).forEach((network) => {
            networkRx += payload.networks[network].rx_bytes
            networkTx += payload.networks[network].tx_bytes
          })
        }
        payload.networkRx = prettysize(networkRx - this.lastNetworkRx, true, true)
        payload.networkTx = prettysize(networkTx - this.lastNetworkTx, true, true)
        this.lastNetworkRx = networkRx
        this.lastNetworkTx = networkTx

        this.perf = payload
      }
    }
  }
}
</script>

<style scoped>
button {
  cursor: initial !important;
  background-color: #343a40;
  border-color: #343a40;
}

button:hover {
  background-color: #343a40;
  border-color: #343a40;
}
</style>
