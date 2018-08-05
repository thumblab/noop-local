const ResourceContainer = require('../ResourceContainer')
const mkdirp = require('mkdirp')

class MysqlContainer extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
  }

  getImage () {
    return 'mysql'
  }

  getEnv () {
    return {
      MYSQL_ROOT_PASSWORD: 'topsecret',
      MYSQL_USER: 'component',
      MYSQL_PASSWORD: 'secret',
      MYSQL_DATABASE: this.friendlyName
    }
  }

  getVolumes (done) {
    const dataDir = `${this.persistenceDir}data/`
    mkdirp(dataDir, (err) => {
      if (err) return done(err)
      done(null, {
        '/var/lib/mysql': dataDir
      })
    })
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from ${componentContainer.component.name} to ${this.resource.name}`)
    const params = {
      host: this.name,
      username: 'component',
      password: 'secret',
      database: this.friendlyName
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }
}

module.exports = MysqlContainer
