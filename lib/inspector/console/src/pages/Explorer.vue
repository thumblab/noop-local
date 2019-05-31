<template>
  <div class="explorer">
    <div class="row text-left full">
      <div class="col-9 flex full">
        <b-input-group class="mb-2">
          <b-input-group-prepend>
            <b-dropdown variant="dark" :text="form.method">
              <b-dropdown-item @click="form.method = 'GET'">GET</b-dropdown-item>
              <b-dropdown-item @click="form.method = 'POST'">POST</b-dropdown-item>
              <b-dropdown-item @click="form.method = 'PUT'">PUT</b-dropdown-item>
              <b-dropdown-item @click="form.method = 'DELETE'">DELETE</b-dropdown-item>
              <b-dropdown-item @click="form.method = 'OPTIONS'">OPTIONS</b-dropdown-item>
            </b-dropdown>
          </b-input-group-prepend>
          <b-form-input placeholder="/api/foo" class="path" v-model="form.path"></b-form-input>
          <b-input-group-append>
            <b-button variant="primary" @click="send">Send</b-button>
            <b-button variant="warning" @click="reset">Reset</b-button>
          </b-input-group-append>
        </b-input-group>
        <b-card no-body class="grow mb-3">
          <b-tabs card>
            <b-tab disabled title="Request"></b-tab>
            <b-tab active title="Body" v-if="form.method !== 'GET'">
              <b-form-select v-model="bodyContentType" @change="selectBodyContentType" class="mb-3">
                <option value="raw">Raw Text (no content-type)</option>
                <option value="text/plain">Plain Text (text/plain)</option>
                <option value="application/json">JSON (application/json)</option>
                <option value="application/javascript">Javascript (application/javascript)</option>
                <option value="application/xml">XML (application/xml)</option>
                <option value="application/xml">XML (text/xml)</option>
                <option value="application/xml">HTML (text/html)</option>
              </b-form-select>
              <b-form-textarea
                  v-model="form.body"
                  placeholder="Request Body"
                  rows="6" />
            </b-tab>
            <b-tab no-body title="Headers">
              <div class="row mt-3 mb-1 mx-1">
                <div class="col-5">
                  <Typeahead 
                      v-model="newHeader.key" 
                      placeholder="content-type" 
                      :minMatchingChars="0" 
                      ref="newHeaderKeyAutocomplete"
                      :data="headerKeySuggest"/>
                </div>
                <div class="col-5">
                  <Typeahead 
                      v-model="newHeader.value"
                      placeholder="value"
                      :minMatchingChars="0"
                      ref="newHeaderValueAutocomplete"
                      :data="headerValueSuggest" />
                </div>
                <div class="col-2">
                  <b-button variant="primary" @click="addHeader"><icon icon="plus-circle" /> Add</b-button>
                </div>
              </div>
              <div class="mb-2">
                <b-list-group flush>
                  <b-list-group-item v-for="(value, key) in form.headers" v-bind:key="key">
                    <strong>{{key}}</strong>
                    <span class="float-right">
                      {{value}}
                      <b-button size="sm" variant="danger" @click="deleteHeader(key)"><icon icon="times-circle" button /></b-button>
                    </span>
                  </b-list-group-item>
                </b-list-group>
              </div>
            </b-tab>
            <b-tab no-body title="Query String">
              <div class="row mt-3 mb-1 mx-1">
                <div class="col-5">
                  <b-input v-model="newQuery.key" placeholder="key" />
                </div>
                <div class="col-5">
                  <b-input v-model="newQuery.value" placeholder="value" />
                </div>
                <div class="col-2">
                  <b-button variant="primary" @click="addQuery"><icon icon="plus-circle" /> Add</b-button>
                </div>
              </div>
              <div class="mb-2">
                <b-list-group flush>
                  <b-list-group-item v-for="(value, key) in qs" v-bind:key="key">
                    <strong>{{key}}</strong>
                    <span class="float-right">
                      {{value}}
                    </span>
                  </b-list-group-item>
                </b-list-group>
              </div>
            </b-tab>
            <b-tab title="Cookies">
              <b-card-text>Coming Soon!</b-card-text>
            </b-tab>
          </b-tabs>
        </b-card>
        <b-card no-body class="grow" v-if="response.statusCode">
          <b-tabs card>
            <b-tab disabled>
              <template slot="title">
                Response <b-badge :variant="responseStatusVariant">{{response.statusCode}} {{response.statusMessage}}</b-badge>
              </template>
            </b-tab>
            <b-tab title="Body" active>
              {{responseBody}}
            </b-tab>
            <b-tab no-body title="Headers">
              <b-list-group flush>
                <b-list-group-item v-for="(value, key) in response.headers" v-bind:key="key">
                  <strong>{{key}}</strong><span class="float-right">{{value}}</span>
                </b-list-group-item>
              </b-list-group>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
      <div class="col-3 flex full pl-0">
        <b-card no-body class="grow">
          <b-card-header header-tag="header"><icon icon="history" /> History</b-card-header>
          <b-list-group flush>
            <b-list-group-item button v-for="(request, index) in history" v-bind:key="index" @click="form = request">
              <b-badge variant="info">{{request.method}}</b-badge>
              {{request.path}}
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import { request } from '@/api'
import Typeahead from 'vue-bootstrap-typeahead'
import Vue from 'vue'
import querystring from 'querystring'

const headers =  {
  'content-type': ['application/json'],
  'cache-control': []
}

export default {
  components: {
    Typeahead
  },
  data () {
    let history = []
    try {
      const parsed = JSON.parse(localStorage.getItem('explorer-history'))
      if (parsed) history = parsed
    } catch (err) {
      // meh
    }
    return {
      form: {
        method: 'GET',
        path: '',
        headers: {},
        body: ''
      },
      history,
      response: {},
      newHeader: {
        key: '',
        value: ''
      },
      newQuery: {
        key: '',
        value: ''
      },
      bodyContentType: 'raw'
    }
  },
  computed: {
    headerKeySuggest (state) {
      return Object.keys(headers)
    },
    headerValueSuggest (state) {
      return headers[state.newHeader.key] || []
    },
    qs (state) {
      if (!/^\/.*\?(.+)$/.test(state.form.path)) {
        return {}
      }
      const query = /^\/.*\?(.+)$/.exec(state.form.path)[1]
      return querystring.parse(query)
    },
    path (state) {
      return state.form.path
    },
    responseBody (state) {
      if (!state.response.body) return ''
      return window.atob(state.response.body)
    },
    responseStatusVariant (state) {
      if (!state.response.statusCode) {
        return null
      } else if (state.response.statusCode >= 500) {
        return 'danger'
      } else if (state.response.statusCode >= 400) {
        return 'warning'
      } else {
        return 'success'
      }
    },
    requestHeaders (state) {
      return state.form.headers
    }
  },
  methods: {
    reset () {
      this.form = {
        method: 'GET',
        path: '',
        headers: {},
        body: ''
      }
    },
    send () {
      this.history.unshift({
        headers: this.form.headers,
        body: this.form.body,
        method: this.form.method,
        path: this.form.path
      })
      localStorage.setItem('explorer-history', JSON.stringify(this.history.slice(0, 20)))
      request.post('/events/public', {
        headers: this.form.headers,
        body: window.btoa(this.form.body),
        method: this.form.method,
        path: this.form.path
      })
        .then((res) => {
          this.response = res.data
        })
    },
    addHeader () {
      if (!this.newHeader.key || !this.newHeader.value) return false
      Vue.set(this.form.headers, this.newHeader.key, this.newHeader.value)
      this.newHeader.key = ''
      this.newHeader.value = ''
      this.$refs.newHeaderKeyAutocomplete.inputValue = ''
      this.$refs.newHeaderValueAutocomplete.inputValue = ''
    },
    deleteHeader (key) {
      Vue.delete(this.form.headers, key)
    },
    selectBodyContentType (type) {
      if (type === 'raw') {
        Vue.delete(this.form.headers, 'content-type')
      } else {
        Vue.set(this.form.headers, 'content-type', type)
      }
    },
    addQuery () {
      if (!this.newQuery.key || !this.newQuery.value) return false
      if (this.qs[this.newQuery.key]) {
        if (Array.isArray(this.qs[this.newQuery.key])) {
          this.qs[this.newQuery.key].push(this.newQuery.value)
        } else {
          this.qs[this.newQuery.key] = [this.qs[this.newQuery.key], this.newQuery.value]
        }
      } else {
        this.qs[this.newQuery.key] = this.newQuery.value
      }
      const newQueryString = querystring.stringify(this.qs)
      if (/\?(.*)$/.test(this.form.path)) {
        this.form.path = this.form.path.replace(/\?(.*)$/, `?${newQueryString}`)
      } else {
        this.form.path = `${this.form.path}?${newQueryString}`
      }
      
      this.newQuery.key = ''
      this.newQuery.value = ''
    }
  },
  watch: {
    path (newPath) {
      if (!/^\//.test(newPath)) this.form.path = `/${newPath}`
    },
    requestHeaders (newHeaders) {
      if (newHeaders['content-type']) {
        this.bodyContentType = newHeaders['content-type']
      }
    }
  }
}
</script>

<style>
.explorer {
  position: absolute;
  bottom: 0;
  top: 15px;
  left: 15px;
  right: 15px;
}

.explorer .nav-item .disabled {
  color: #2c3e50 !important;
}

.request-bar .form-control {
  width: auto
}

.path {
  border-radius: 0 !important;
}
</style>
