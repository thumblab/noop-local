<template>
  <div class="indicator">
    <icon v-if="connected" icon="link" class="connected"/>
    <icon v-else icon="exclamation-triangle" class="disconnected"/>
  </div>
</template>

<script>
export default {
  computed: {
    connected (state) {
      return state.$store.getters['changes/connected']()
    }
  },
  created () {
    this.$store.dispatch('changes/listen')
  }
}
</script>

<style>
.indicator {
  margin: 6px;
}
.connected {
  color:green;
}
.disconnected {
  color:orange;
}
</style>
