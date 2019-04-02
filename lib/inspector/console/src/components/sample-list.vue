<template>
  <div class="container">
    <b-card title="Samples currently being served">
      <table class="table table-striped table-sm">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Name</th>
            <th scope="col">Aisle</th>
            <th scope="col">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sample in samples" :key="sample.id">
            <th scope="row">{{ sample.id }}</th>
            <td>{{ sample.name }}</td>
            <td>{{ sample.aisle }}</td>
            <td><button class="btn-danger" @click.stop="stopServing(sample.id)">Stop Serving</button></td>
          </tr>
        </tbody>
        <tr>
          <td><b-form-input v-model="id" placeholder="abc123"></td>
          <td><b-form-input v-model="name" placeholder="Fancy cheese on a toothpick"></td>
          <td><b-form-input v-model="aisle" placeholder="5"></td>
          <td><button class="btn-primary" @click.stop="startServing">Start Serving</button></td>
        </tr>
      </table>
    </b-card>
  </div>
</template>

<script>
import { addSample, listSamples, removeSample } from '@/api'
export default {
  created () {
    this.getSamples()
  },
  data () {
    return {
      id: '',
      name: '',
      aisle: '',
      samples: []
    }
  },
  methods: {
    getSamples () {
      listSamples().then(response => {
        this.samples = response.data
      }).catch(err => {
        alert(`Failed to get list of samples: ${err.message}`)
      })
    },
    startServing () {
      addSample(this.id, this.name, this.aisle).then(response => {
        this.id = ''
        this.name = ''
        this.aisle = ''
        this.getSamples()
      }).catch(err => {
        alert(`Failed to start serving sample ${this.id}: ${err.message}`)
      })
    },
    stopServing (id) {
      removeSample(id).then(response => {
        this.getSamples()
      }).catch(err => {
        alert(`Failed to stop serving sample ${id}: ${err.message}`)
      })
    }
  }
}
</script>

<style>
body {
  padding-top: 20px;
}
</style>
