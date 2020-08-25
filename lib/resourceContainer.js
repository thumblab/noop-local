const Container = require('./container')
const os = require('os')
const async = require('async')

class ResourceContainer extends Container {
  constructor (resource, devServer) {
    super(devServer, resource.name, 'resource')
    this.resource = resource
    this.persistenceDir = os.homedir() + `/.noop/apps/${devServer.app.id}/resources/${resource.name}/`
    this.outputLogs = false
  }

  getImage () {
    return 'FakeImageThatDoesntExist'
  }

  reload (done) {
    async.auto({
      stop: (done) => this.stop(done),
      start: ['stop', (results, done) => this.start(done)]
    }, done)
  }
}

module.exports = ResourceContainer
