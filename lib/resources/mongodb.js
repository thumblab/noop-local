const ResourceContainer = require('../ResourceContainer')

class MongodbContainer extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
  }

  getImage () {
    return 'mongo:4.1.1-xenial'
  }

  getEnv () {
    return {
      MONGO_INITDB_ROOT_USERNAME: 'noop',
      MONGO_INITDB_ROOT_PASSWORD: 'secret'
    }
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from ${componentContainer.component.name} to ${this.resource.name}`)
    done()
  }
}

module.exports = MongodbContainer
