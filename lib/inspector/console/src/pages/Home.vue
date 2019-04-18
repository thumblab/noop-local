<template>
  <div>
    <div>
      <h4 class="float-left">{{app.root}}</h4>
      <b-button-toolbar class="float-right">
        <b-button-group class="mx-1">
          <b-button variant="primary" @click="openBrowser"><icon icon="globe" /> Open in Browser</b-button>
          <b-button variant="primary" v-b-popover.hover.bottom="'Coming soon to a developer near you!'"><icon icon="code" /> API Explorer</b-button>
        </b-button-group>
        <b-button-group class="mx-1">
          <b-button variant="warning" v-b-modal.restart-modal><icon icon="sync" /> Restart</b-button>
          <b-button variant="warning" v-b-modal.reset-modal><icon icon="trash-alt" /> Reset</b-button>
          <b-button variant="warning" v-b-modal.stop-modal><icon icon="power-off" /> Stop</b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="clearfix"></div>
    <div class="row">
      <div class="col-4">
        <b-card no-body class="text-left">
          <template slot="header">
            <icon icon="server" /> Components
          </template>
          <b-list-group flush>
            <b-list-group-item button v-for="component in components" v-bind:key="component.id" @click="$router.push(`/components/${component.id}`)">
              <strong>{{component.id}}</strong>&nbsp;<b-badge variant="info">{{component.type}}</b-badge>
              <br />
              <small>{{component.root.substring(app.root.length)}}</small>
            </b-list-group-item>
          </b-list-group>
          <p v-if="!components.length">No components available</p>
        </b-card>
      </div>
      <div class="col-4">
        <b-card no-body class="text-left">
          <template slot="header">
            <icon icon="database" /> Resources
          </template>
          <b-list-group flush>
            <b-list-group-item button v-for="resource in resources" v-bind:key="resource.id" @click="$router.push(`/resources/${resource.id}`)">
              <strong>{{resource.id}}</strong>
              <br />
              <small>{{resource.prettyType}}</small>
            </b-list-group-item>
          </b-list-group>
        </b-card>
        <p v-if="!resources.length">No resources running</p>
      </div>
      <div class="col-4">
        <b-card class="text-left">
          <template slot="header">
            <icon icon="traffic-light" /> Traffic
          </template>
          <b-card-text>Live traffic inspection coming soon to a developer near you!</b-card-text>
        </b-card>
      </div>
    </div>
    <b-modal id="reset-modal" title="Reset Confirmation" @ok="handleReset" okTitle="Reset!" okVariant="danger">
      <p class="text-left">
        Are you sure you want to reset your local environment of this app? This will permanently delete all state from ALL resources!
      </p>
    </b-modal>
    <b-modal id="stop-modal" title="Stop Confirmation" @ok="handleStop" okTitle="Stop!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to stop your local development environment of this app?
      </p>
    </b-modal>
    <b-modal id="restart-modal" title="Restart Confirmation" @ok="handleRestart" okTitle="Restart!" okVariant="warning">
      <p class="text-left">
        Are you sure you want to restart your local development environment of this app?
      </p>
    </b-modal>
  </div>
</template>

<script>
import pretty from '@/pretty'

export default {
  computed: {
    app (state) {
      return state.$store.getters['app/get']()
    },
    components (state) {
      return state.$store.getters['components/list']()
    },
    resources (state) {
      return state.$store.getters['resources/list']().map((resource) => {
        resource.prettyType = pretty.resourceTypes[resource.type] || 'Unknown'
        return resource
      })
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('app/get')
      this.$store.dispatch('components/list')
      this.$store.dispatch('resources/list')
    },
    openBrowser () {
      window.open('https://localnoop.app:1234', '_blank')
    },
    handleReset () {
      console.log('reset requested')
    },
    handleStop () {
      console.log('stop requested')
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

<style scoped>
.row {
    margin-top: 12px; 
}
</style>
