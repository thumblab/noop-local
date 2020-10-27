<template>
  <div class="component">
    <div>
      <h1 class="float-left">{{component.id}} <small>component</small></h1>
      <b-button-toolbar class="float-right">
        <PerformanceBar :path="`/components/${this.$route.params.componentId}/performance`" />
        <b-button-group class="ml-2">
          <b-button variant="warning" v-if="component.type === 'task'" v-b-modal.run-modal><icon icon="redo" /> Execute</b-button>
          <b-button variant="warning" v-b-modal.restart-modal><icon icon="sync" /> Restart</b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="clearfix"></div>
    <b-modal v-if="component.type === 'task'" id="run-modal" title="Execute Confirmation" @ok="handleRun" okTitle="Execute!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to execute the <strong>{{component.id}}</strong> component?
      </p>
    </b-modal>
    <b-modal id="restart-modal" title="Restart Confirmation" @ok="handleRestart" okTitle="Restart!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to restart the <strong>{{component.id}}</strong> component?
      </p>
    </b-modal>
    <div class="row flexrow">
      <div class="col-6 flex full">

        <div id="accordion" class="text-left">
          <b-card no-body class="mb-3">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.summary variant="primary">Component Summary</b-button>
            </b-card-header>
            <b-collapse id="summary" visible role="tabpanel">
              <b-list-group flush>
                <b-list-group-item>
                  <strong>Component Type</strong><span class="float-right text-right">{{component.type}}</span>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Root Folder</strong><span class="float-right text-right">{{component.root}}</span>
                </b-list-group-item>
                <!-- <b-list-group-item>
                  <strong>Listening Port</strong><span class="float-right text-right">{{component.port}}</span>
                </b-list-group-item> -->
                <b-list-group-item>
                  <strong>Resource Dependencies</strong>
                  <ul class="float-right" v-if="component.resources && component.resources.length">
                    <li v-for="resourceId in component.resources" v-bind:key="resourceId">
                      <router-link :to="`/resources/${resourceId}`">{{resourceId}}</router-link>
                    </li>
                  </ul>
                  <ul v-else><li>none</li></ul>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Routes Serviced</strong>
                  <ul class="float-right" v-if="component.routes && component.routes.length">
                    <li v-for="route in component.routes" v-bind:key="`${route.method}-${route.pattern}`">
                      {{route.method}} {{route.pattern}} <b-badge v-if="route.internal" variant="warning">internal</b-badge>
                    </li>
                  </ul>
                  <ul v-else><li>none</li></ul>
                </b-list-group-item>
              </b-list-group>
            </b-collapse>
          </b-card>

          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.variables variant="primary">Environment Variables</b-button>
            </b-card-header>
            <b-collapse id="variables" role="tabpanel">
              <Variables />
            </b-collapse>
          </b-card>

          <b-card no-body class="mb-1" v-if="component.build">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.build variant="primary">
                Build Details <small v-if="component.build.duration">(took {{component.build.duration}})</small>
              </b-button>
            </b-card-header>
            <b-collapse id="build" role="tabpanel">
              <p id="build-output">
                <span v-for="(line, index) in component.build.output" v-bind:key="index">
                  <strong v-if="/^Step /.test(line)">{{line.replace(/^Step \d+\/\d+ : /, '')}}</strong>
                  <span v-else>{{line}}</span>
                  <br />
                </span>
              </p>
            </b-collapse>
          </b-card>

          <b-card no-body class="mb-1" v-if="component.type === 'task'">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block href="#" v-b-toggle.executions variant="primary">Task Executions</b-button>
            </b-card-header>
            <b-collapse id="executions" role="tabpanel">

            </b-collapse>
          </b-card>

        </div>
      </div>
      <div class="col-6 flex full">
        <TerminalCard class="mb-3" v-if="component.type !== 'static' && component.type !== 'task'" />
        <LogCard :path="`/components/${this.$route.params.componentId}/logs`" />
      </div>
    </div>
  </div>
</template>

<script>
import LogCard from '../components/LogCard'
import Variables from '../components/Variables.vue'
import TerminalCard from '../components/TerminalCard.vue'
import PerformanceBar from '../components/PerformanceBar.vue'
import moment from 'moment'
import { request } from '../api'

export default {
  components: {
    LogCard,
    Variables,
    TerminalCard,
    PerformanceBar
  },
  computed: {
    component (state) {
      const component = state.$store.getters['components/byId'](this.$route.params.componentId) || {}
      if (component.build && component.build.end) {
        const start = moment(component.build.start)
        const end = moment(component.build.end)
        component.build.duration = moment.duration(end.diff(start), 'milliseconds').humanize()
      }
      return component
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('components/byId', this.$route.params.componentId)
    },
    handleRestart () {
      request.post(`/components/${this.$route.params.componentId}/restart`)
    },
    handleRun () {
      request.post(`/components/${this.$route.params.componentId}/run`)
    }
  },
  created () {
    this.refresh()
  }
}
</script>

<style scoped>
.logs-card {
  height: 100%;
  flex-grow: 1;
}

.variable-card {
  flex-grow: 2;
}

.component {
  height: 100%;
}

ul {
  list-style-type: none;
  margin-bottom: 0;
  padding-left: 20px;
}

header {
  padding: 0 !important;
}

#accordion header > a {
  border-radius: 0;
  text-align: left;
  padding-top: 12px;
  padding-bottom: 12px;
}

#build-output {
  font-family: "Lucida Console", Monaco, monospace;
  padding: 1em;
}
</style>
