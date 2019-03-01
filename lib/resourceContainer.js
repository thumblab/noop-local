const Container = require('./container')
const os = require('os')

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
}

module.exports = ResourceContainer