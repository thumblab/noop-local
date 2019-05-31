<template>
  <div id="home">
    <div>
      <h4 class="float-left">{{app.root}}</h4>
      <b-button-toolbar class="float-right">
        <b-button-group class="mx-1">
          <b-button variant="primary" @click="openBrowser"><icon icon="globe" /> Open in Browser</b-button>
          <b-button variant="primary" @click="$router.push('/explorer')"><icon icon="code" /> API Explorer</b-button>
        </b-button-group>
        <b-button-group class="mx-1">
          <b-button variant="warning" v-b-modal.restart-modal><icon icon="sync" /> Restart</b-button>
          <b-button variant="warning" v-b-modal.reset-modal><icon icon="trash-alt" /> Reset</b-button>
          <b-button variant="warning" v-b-modal.stop-modal><icon icon="power-off" /> Stop</b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="clearfix"></div>
    <div class="row flexrow">
      <div class="col-4 flex full">
        <b-card no-body class="text-left">
          <template slot="header">
            <icon icon="server" /> Components
          </template>
          <b-list-group flush>
            <b-list-group-item button>
              <h1 class="float-left mr-2 mb-0"><icon icon="book" /></h1>
              <h5 class="mb-0">Component Guide</h5>
              Learn more about running your code using functions, services, tasks, and more on noop.
            </b-list-group-item>
            <b-list-group-item button v-for="component in components" v-bind:key="component.id" @click="$router.push(`/components/${component.id}`)">
              <strong>{{component.id}}</strong><b-badge class="float-right" variant="info">{{component.type}}</b-badge>
              <br />
              <small>{{component.root.substring(app.root.length)}}</small>
            </b-list-group-item>
          </b-list-group>
          <p v-if="!components.length">No components available</p>
        </b-card>
      </div>
      <div class="col-4 flex full">
        <b-card no-body class="text-left">
          <template slot="header">
            <icon icon="database" /> Resources
          </template>
          <b-list-group flush>
            <b-list-group-item button>
              <h1 class="float-left mr-2 mb-0"><icon icon="book" /></h1>
              <h5 class="mb-0">Resource Guide</h5>
              Learn more about leveraging databases, queues, and other backend services within your noop app.
            </b-list-group-item>
            <b-list-group-item button v-for="resource in resources" v-bind:key="resource.id" @click="$router.push(`/resources/${resource.id}`)">
              <strong>{{resource.id}}</strong>
              <br />
              <small>{{resource.prettyType}}</small>
            </b-list-group-item>
          </b-list-group>
        </b-card>
        <p v-if="!resources.length">No resources running</p>
      </div>
      <div class="col-4 flex full">
        <TrafficCard />
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
    <b-modal id="restart-modal" title="Restart Confirmation" @ok="handleRestart" okVariant="warning" :busy="restarting">
      <template slot="modal-ok">
        <span v-if="restarting">Restarting <icon icon="sync" spin /></span>
        <span v-else>Restart!</span>
      </template>
      <p class="text-left">
        Are you sure you want to restart your local development environment of this app?
      </p>
    </b-modal>
  </div>
</template>

<script>
import pretty from '@/pretty'
import TrafficCard from '@/components/TrafficCard.vue'
import { request } from '@/api'

export default {
  data () {
    return {
      restarting: false
    }
  },
  components: {
    TrafficCard
  },
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
      request.post('/server/reset')
    },
    handleStop () {
      request.post('/server/stop')
    },
    handleRestart (event) {
      event.cancel()
      this.restarting = true
      request.post('/server/restart').then(() => {
        location.reload()
      })
    }
  },
  created () {
    this.refresh()
  }
}
</script>

<style scoped>
.row {
    margin-top: 0; 
}

#home {
  height: 100%;
}

h1 {
  font-size: 2.5em;
}
</style>
