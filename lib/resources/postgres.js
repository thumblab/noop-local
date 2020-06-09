const ResourceContainer = require('../ResourceContainer')
const mkdirp = require('mkdirp')

class PostgresContainer extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
  }

  getImage () {
    return 'postgres:latest'
  }

  getEnv () {
    return {
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: this.friendlyName
    }
  }

  getVolumes (done) {
    const dataDir = `${this.persistenceDir}data/`
    mkdirp(dataDir, (err) => {
      if (err) return done(err)
      done(null, {
        '/var/lib/postgresql/data': dataDir
      })
    })
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from ${componentContainer.component.name} to ${this.resource.name}`)
    const params = {
      host: this.name,
      username: 'postgres',
      password: 'secret',
      database: this.friendlyName,
      url: `postgresql://postgres:secret@${this.name}`
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }
}

module.exports = PostgresContainer
