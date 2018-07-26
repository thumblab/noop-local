const Container = require('./container')

class ResourceContainer extends Container {
  constructor (resource, devServer) {
    super(devServer, resource.name, 'resource')
    this.resource = resource
  }

  getImage () {
    return 'FakeImageThatDoesntExist'
  }
}

module.exports = ResourceContainer