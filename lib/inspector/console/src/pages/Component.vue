<template>
  <div class="box">
    <h2 class="float-left">
      {{component.id}} <b-badge variant="info">{{component.type}}</b-badge>
    </h2>
    <b-button-toolbar class="float-right">
      <b-button-group class="mx-1">
        <b-button variant="warning" v-b-modal.restart-modal><icon icon="sync" /> Restart</b-button>
      </b-button-group>
    </b-button-toolbar>
    <div class="clearfix"></div>
    <b-modal id="restart-modal" title="Restart Confirmation" @ok="handleRestart" okTitle="Restart!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to restart the <strong>{{component.id}}</strong> component?
      </p>
    </b-modal>
    <div class="row full">
      <div class="col-6 full flex">
        <b-card class="text-left variable-card scroll">
          <template slot="header">
            Environment Variables
          </template>
          <Variables />
        </b-card>
        <b-card no-body class="text-left terminal-card" v-if="component.type !== 'static' && component.type !== 'task'">
          <template slot="header">
            Debug Terminal
          </template>
          <Terminal />
        </b-card>
      </div>
      <div class="col-6 flex full">
        <b-card no-body class="text-left logs-card">
          <template slot="header">
            Component Logs <b-badge variant="success">live</b-badge>
          </template>
          <LogStream :path="`/components/${this.$route.params.componentId}/logs`" />
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import LogStream from '@/components/LogStream.vue'
import Variables from '@/components/Variables.vue'
import Terminal from '@/components/Terminal.vue'

export default {
  components: {
    LogStream,
    Variables,
    Terminal
  },
  computed: {
    component (state) {
      return state.$store.getters['components/byId'](this.$route.params.componentId) || {}
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('components/byId', this.$route.params.componentId)
    },
    handleRestart () {
      console.log('restart requested')
    }
  },
  created () {
    this.refresh()
  }
}
</script>

<style>
.terminal-card {
  margin-top: 12px;
  flex-grow: 1;
}

.logs-card {
  height: 100%;
  flex-grow: 1;
}

.variable-card {
  flex-grow: 2;
}

.logs-card .list-group {
  font-family: "Lucida Console", Monaco, monospace;
}

.logs-card .list-group-item {
  padding: 4px 10px;
}

.full {
  height: 100%;
}

.flex {
  display: flex;
  flex-flow: column;
}

.box {
  height: 80%
}
</style>
