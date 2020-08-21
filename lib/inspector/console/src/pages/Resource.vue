<template>
  <div class="component">
    <div>
      <h1 class="float-left">{{resource.id}} <small>resource</small></h1>
      <b-button-toolbar class="float-right">
        <b-button-group class="ml-2">
          <b-button variant="warning" v-b-modal.restart-modal>
            <icon icon="sync" /> Restart
          </b-button>
          <b-button variant="warning">
            <icon icon="trash-alt" /> Reset
          </b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="clearfix"></div>
    <div class="text-left row">
      <div class="col-6 mb-3">
        <b-card no-body>
          <template slot="header">
            <icon icon="database" /> Resource Summary
          </template>
          <b-list-group flush>
            <b-list-group-item>
              <strong>Resource Type</strong><span class="float-right">{{resource.type}}</span>
            </b-list-group-item>
            <b-list-group-item>
              <strong>Connected Components</strong>
              <ul class="float-right text-right" v-if="resource.components && resource.components.length">
                <li v-for="componentId in resource.components" v-bind:key="componentId">
                  <router-link :to="`/components/${componentId}`">{{componentId}}</router-link>
                </li>
              </ul>
            </b-list-group-item>
            <b-list-group-item v-if="resource.parameters">
              <strong>Parameters</strong>
              <div v-for="(value, param) in resource.parameters" v-bind:key="param">
                {{param}} <span class="float-right">{{value}}</span>
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </div>
    </div>
    <div class="row text-left">
      <div class="col-12">
        <b-card no-body>
          <template slot="header">
            <icon icon="code" /> Code Samples
          </template>
          <b-tabs card>
            <b-tab v-for="example in examples" v-bind:key="example.name" :title="example.name">
              <pre><code>{{example.code}}</code></pre>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </div>
    <b-modal id="restart-modal" title="Restart Confirmation" @ok="handleRestart" okTitle="Restart!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to restart the <strong>{{resource.id}}</strong> resource?
      </p>
    </b-modal>
  </div>
</template>

<script>
import { request } from '../api'

export default {
  computed: {
    resource (state) {
      const resource = state.$store.getters['resources/byId'](this.$route.params.resourceId) || {}
      return resource
    },
    examples (state) {
      if (!this.resource) return {}
      switch (this.resource.type) {
        case 'dynamodb':
          let noopfileParamsString = `-p hashKeyName=${this.resource.parameters.hashKeyName} -p hashKeyType=${this.resource.parameters.hashKeyType}`
          if (this.resource.parameters.rangeKeyName) noopfileParamsString += ` -p rangeKeyName=${this.resource.parameters.rangeKeyName} -p rangeKeyType=${this.resource.parameters.rangeKeyType}`
          return [
            {
              name: 'Noopfile',
              code: `RESOURCE ${this.resource.id} dynamodb ${noopfileParamsString}\n` +
                `ENV DYNAMO_TABLE $.resources.${this.resource.id}.tableName\n` +
                `ENV DYNAMO_ENDPOINT $.resources.${this.resource.id}.endpoint`
            },
            {
              name: 'NodeJS',
              code: 'const AWS = require(\'aws-sdk\')\n' +
              'const endpoint = new AWS.Endpoint(process.env[\'DYNAMO_ENDPOINT\'])\n' +
              'const table = process.env[\'DYNAMO_TABLE\']\n' +
              'const dynamo = new AWS.DynamoDB.DocumentClient({ service: new AWS.DynamoDB(config) })\n\n' +
              'dynamo.scan({TableName: table}, (err, data) => {' +
              '  ...' +
              '})'
            }
          ]
        case 'mongodb':
          return [
            {
              name: 'Noopfile',
              code: `RESOURCE ${this.resource.id} mongodb\n` +
                `ENV MONGO_URI $.resources.${this.resource.id}.uri`
            }
          ]
        case 'mysql':
          return [
            {
              name: 'Noopfile',
              code: `RESOURCE ${this.resource.id} mysql\n` +
                `ENV HOSTNAME $.resources.${this.resource.id}.host\n` +
                `ENV DATABASE_USER $.resources.${this.resource.id}.username\n` +
                `ENV DATABASE_PASSWORD $.resources.${this.resource.id}.password\n` +
                `ENV DATABASE $.resources.${this.resource.id}.database`
            }
          ]
        case 'postgresql':
          return [
            {
              name: 'Noopfile',
              code: `RESOURCE ${this.resource.id} postgresql\n` +
                `ENV DATABASE_URL $.resources.${this.resource.id}.url`
            }
          ]
      }
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('resources/byId', this.$route.params.resourceId)
    },
    handleRestart () {
      request.post(`/resources/${this.$route.params.resourceId}/restart`)
    }
  },
  created () {
    this.refresh()
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
  margin-bottom: 0;
  padding-left: 20px;
}
</style>
