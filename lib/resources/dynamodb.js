const ResourceContainer = require('../resourceContainer')
const mkdirp = require('mkdirp')

class DynamodbContainer extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
  }

  getImage () {
    return 'cnadiminti/dynamodb-local'
  }

  getEnv () {
    return {}
  }

  getVolumes (done) {
    const dataDir = `${this.persistenceDir}data/`
    mkdirp(dataDir, (err) => {
      if (err) return done(err)
      done(null, {
        '/dynamodb_local_db': dataDir
      })
    })
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from ${componentContainer.component.name} to ${this.resource.name}`)
    const params = {
      endpoint: `http://${this.name}:8000`,
      accessKey: 'fakeKey',
      secretKey: 'keySecret',
      tableName: this.friendlyName
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }

  start (done) {
    ResourceContainer.constructor.start.call(this, (err) => {
      if (err) return done(err)
      // TODO ensure table exists on dynamod local
      done()
    })
  }
}

module.exports = DynamodbContainer
