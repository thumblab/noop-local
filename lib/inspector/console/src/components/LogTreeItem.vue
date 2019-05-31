<template>
  <div>
    <b-badge variant="dark" class="float-left mt-1">{{log.time.format('hh:mm:ss.SSS')}}</b-badge>
    <LogTree class="float-left" :data="log.json" :raw="log.data" :level="0" />
  </div>
</template>

<script>
import LogTree from '@/components/LogTree.vue'

export default {
  props: ['log'],
  components: {
    LogTree
  }
}
</script>

<style>

</style>
