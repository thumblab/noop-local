<template>
  <b-card no-body class="text-left traffic-card">
    <template slot="header">
      <icon icon="traffic-light" /> Traffic
    </template>
    <b-list-group flush>
      <b-list-group-item button v-for="request in traffic" v-bind:key="request.id" @click="$router.push(`/traffic/${request.id}`)">
        <div>
          <b-badge variant="dark">#{{request.id}}</b-badge><span class="path">{{request.method}} {{request.path}}</span>
        </div>
        <div>
          <b-badge variant="info">{{request.component}}</b-badge>
          <b-badge v-if="request.prettyRequestSize" variant="secondary">{{request.prettyRequestSize}} req</b-badge>
          <b-badge v-if="request.prettyResponseSize" variant="secondary">{{request.prettyResponseSize}} res</b-badge>
          <b-badge :variant="request.statusVariant">{{request.statusCode || '???'}}</b-badge>
          <b-badge variant="dark" v-if="request.duration">{{request.duration}}ms</b-badge>
        </div>
      </b-list-group-item>
    </b-list-group>
    <b-list-group-item v-if="!traffic.length">No traffic available</b-list-group-item>
  </b-card>
</template>

<script>
import prettysize from 'prettysize'

export default {
  computed: {
    traffic (state) {
      const requests = state.$store.getters['traffic/list']()
      if (!requests) return []
      return requests.map((request) => {
        if (!request.statusCode) {
          request.statusVariant = 'secondary'
        } else if (request.statusCode >= 500) {
          request.statusVariant = 'danger'
        } else if (request.statusCode >= 400) {
          request.statusVariant = 'warning'
        } else {
          request.statusVariant = 'success'
        }
        if (request.requestSize >= 0) request.prettyRequestSize = prettysize(request.requestSize, true, true)
        if (request.responseSize >= 0) request.prettyResponseSize = prettysize(request.responseSize, true, true)
        if (request.responseTime) {
          request.duration = new Date(request.responseTime).getTime() - new Date(request.requestTime).getTime()
        }
        return request
      })
    }
  },
  created () {
    this.$store.dispatch('traffic/listen')
  }
}
</script>

<style>
.traffic-card {
  overflow: scroll;
  flex-grow: 1;
}
.traffic-card .badge {
  margin-right: 8px;
}

.traffic-card .path {
  font-size: 0.9em;
}
</style>
