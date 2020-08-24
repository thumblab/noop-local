<template>
  <div>
    <b-form>
      <div class="row">
        <div class="col-md-4 offset-md-1">
          <Typeahead class="m-2" size="sm" v-model="form.key" placeholder="Override Key" :data="keys"/>
        </div>
        <div class="col-md-4">
          <b-input class="m-2" size="sm" v-model="form.value" placeholder="Override Value"></b-input>
        </div>
        <div class="col-md-2">
          <b-button class="m-2" size="sm" v-on:click="submit" variant="primary">Override</b-button>
        </div>
      </div>
    </b-form>
    <div class="clearfix"></div>
    <b-list-group flush>
      <b-list-group-item v-for="(variable, key) in component.variables" v-bind:key="key">
        <div class="float-right">
          <b-badge :variant="(variable[0].source === 'inspector') ? 'warning' : 'info'">{{variable[0].source}}</b-badge>
          <div class="text-right" v-if="variable[0].source === 'inspector'">
            <span class="pointer" v-on:click="removeVariable(key)">
              <icon icon="times-circle" :id="key"/>
            </span>
          </div>
        </div>

        <strong>{{key}}</strong><br />{{variable[0].value}}

      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import Typeahead from 'vue-bootstrap-typeahead'

export default {
  data () {
    return {
      form: {
        key: '',
        value: ''
      }
    }
  },
  components: {
    Typeahead
  },
  computed: {
    component (state) {
      return state.$store.getters['components/byId'](this.$route.params.componentId) || {}
    },
    keys (state) {
      if (!this.component || !this.component.variables) return []
      return Object.keys(this.component.variables)
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('components/byId', this.$route.params.componentId)
    },
    submit (event) {
      event.preventDefault()
      this.$store.dispatch('components/putVariable', {
        id: this.$route.params.componentId,
        key: this.form.key,
        value: this.form.value
      }).then(() => {
        this.form.value = ''
      })
    },
    removeVariable (key) {
      this.$store.dispatch('components/removeVariable', {
        id: this.$route.params.componentId,
        key
      })
    }
  },
  created () {
    this.refresh()
  }
}
</script>

<style scoped>
table {
  margin-top: -12px;
}

.row > div {
  padding: 0;
}

.row div.col-md-2 {
  padding-left: 15px;
}

.list-group-item {
  padding: 8px 20px;
}
</style>
