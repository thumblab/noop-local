<template>
  <div class="table-responsive">
    <b-table striped borderless :items="items"></b-table>
  </div>
</template>

<script>
export default {
  computed: {
    component (state) {
      return state.$store.getters['components/byId'](this.$route.params.componentId) || {}
    },
    items (state) {
      if (!this.component.variables) return []
      return Object.keys(this.component.variables).map((key) => {
        return {
          key,
          value: this.component.variables[key][0].value,
          source: this.component.variables[key][0].source
        }
      })
    }
  },
  methods: {
    refresh () {
      this.$store.dispatch('components/list', this.$route.params.componentId)
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
</style>
