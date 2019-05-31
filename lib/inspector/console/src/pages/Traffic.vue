<template>
  <div class="traffic">
    <div>
      <h1 class="float-left">Traffic Event #{{request.id}}</h1>
      <b-button-toolbar class="float-right">
        <b-button-group class="ml-2">
          <b-button variant="warning" @click="replay">
            <icon icon="sync" /> Replay
          </b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="clearfix"></div>
    <div class="row flexrow">
      <div class="col-6 flex full">
        <div id="accordion" class="text-left">
          <b-card no-body class="mb-3">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.request-summary variant="primary">Request Summary</b-button>
            </b-card-header>
            <b-collapse id="request-summary" visible role="tabpanel">
              <b-list-group flush>
                <b-list-group-item>
                  <strong>Path</strong>
                  <div class="float-right">{{request.path}}</div>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Method</strong>
                  <div class="float-right">{{request.method}}</div>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Servicing Component</strong>
                  <div class="float-right">{{request.component}}</div>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Source</strong>
                  <div class="float-right">{{request.source}}</div>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Body Size</strong>
                  <div class="float-right">{{request.prettyRequestSize}}</div>
                </b-list-group-item>
              </b-list-group>
            </b-collapse>
          </b-card>
          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.request-headers variant="primary">Request Headers</b-button>
            </b-card-header>
            <b-collapse id="request-headers" role="tabpanel">
              <b-list-group flush>
                <b-list-group-item v-for="(header, index) in request.requestHeaders" v-bind:key="header">
                  <strong>{{index}}</strong><br />{{header}}
                </b-list-group-item>
              </b-list-group>
            </b-collapse>
          </b-card>
          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.request-body variant="primary">
                Request Body
                <b-badge v-if="request.requestContentType" variant="dark" class="float-right">
                  {{request.requestContentType}}
                </b-badge>
              </b-button>
            </b-card-header>
            <b-collapse id="request-body" visible role="tabpanel">
              <pre>{{request.requestBody}}</pre>
            </b-collapse>
          </b-card>
        </div>
      </div>
      <div class="col-6 flex full">
        <div id="accordion" class="text-left">
          <b-card no-body class="mb-3">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.response-summary variant="primary">Response Summary</b-button>
            </b-card-header>
            <b-collapse id="response-summary" visible role="tabpanel">
              <b-list-group flush>
                <b-list-group-item>
                  <strong>Status Code</strong>
                  <div class="float-right">
                    <b-badge :variant="request.statusVariant">{{request.statusCode}}</b-badge> {{request.statusMessage}}
                  </div>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Duration</strong>
                  <div class="float-right">{{request.duration}}ms</div>
                </b-list-group-item>
              </b-list-group>
            </b-collapse>
          </b-card>
          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.response-headers variant="primary">Response Headers</b-button>
            </b-card-header>
            <b-collapse id="response-headers" role="tabpanel">
              <b-list-group flush>
                <b-list-group-item v-for="(header, index) in request.responseHeaders" v-bind:key="header">
                  <strong>{{index}}</strong><br />{{header}}
                </b-list-group-item>
              </b-list-group>
            </b-collapse>
          </b-card>
          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.response-body variant="primary">
                Response Body
                <b-badge v-if="request.responseContentType" variant="dark" class="float-right">
                  {{request.responseContentType}}
                </b-badge>
              </b-button>
            </b-card-header>
            <b-collapse id="response-body" visible role="tabpanel">
              <pre>{{request.responseBody}}</pre>
            </b-collapse>
          </b-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import prettysize from 'prettysize'
import contentType from 'content-type'
import { request } from '@/api'

export default {
  computed: {
    request (state) {
      const request = state.$store.getters['traffic/byId'](this.$route.params.requestId)
      if (!request) return {}
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
      try {
        if (request.requestHeaders['content-type']) request.requestContentType = contentType.parse(request.requestHeaders['content-type']).type
        if (request.responseHeaders['content-type']) request.responseContentType = contentType.parse(request.responseHeaders['content-type']).type
      } catch (err) {
        // nothin
      }
      if (request.requestContentType === 'application/json') {
        try {
          request.requestBody = JSON.stringify(JSON.parse(request.requestBody), null, 2)
        } catch (err) {
          // nothin
        }
      }
      if (request.responseContentType === 'application/json') {
        try {
          request.responseBody = JSON.stringify(JSON.parse(request.responseBody), null, 2)
        } catch (err) {
          // nothin
        }
      }
      return request
    }
  },
  created () {
    this.$store.dispatch('traffic/listen')
  },
  methods: {
    replay () {
      request.post('/events/public', {
        headers: this.request.requestHeaders,
        body: window.btoa(this.request.requestBody),
        method: this.request.method,
        path: this.request.path
      }).then((res) => {
          const requestId = res.data.headers['x-request-id']
          this.$router.push(`/traffic/${requestId}`)
          location.reload()
        })
    }
  }
}
</script>

<style scoped>
header {
  padding: 0 !important;
}

pre {
  margin-bottom: 0;
}

#accordion header > a {
  border-radius: 0;
  text-align: left;
  padding-top: 8px;
  padding-bottom: 8px;
}

#request-body, #response-body {
  padding: 12px;
}

.badge.float-right {
  margin-top: 4px
}
</style>
