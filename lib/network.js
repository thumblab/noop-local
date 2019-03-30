const Docker = require('dockerode')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class Network {
  constructor (appId) {
    this.id = appId
    this.dockerNetwork = docker.getNetwork(this.id)
  }

  ensure (done) {
    this.dockerNetwork.inspect((err) => {
      if (err && err.statusCode === 404) {
        this.create(done)
      } else {
        done(err)
      }
    })
  }

  create (done) {
    const opts = {
      Name: this.id,
      CheckDuplicate: true
    }
    docker.createNetwork(opts, done)
  }

  attachContainer (containerId, done) {
    this.dockerNetwork.connect({Container: containerId}, done)
  }
}

module.exports = Network
