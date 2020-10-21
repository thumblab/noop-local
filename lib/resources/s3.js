const ResourceContainer = require('../ResourceContainer')
const mkdirp = require('mkdirp')
const Container = require('../container')

class S3Container extends ResourceContainer {
  constructor (resource, devServer) {
    super(resource, devServer)
    this.cmd = ['server', '/data']
  }

  getImage () {
    return 'minio/minio:latest'
  }

  getEnv () {
    return {
      MINIO_ACCESS_KEY: 'ABCDEF',
      MINIO_SECRET_KEY: '1234567890',
      MINIO_REGION_NAME: 'local',
      MINIO_BROWSER: 'off'
    }
  }

  getVolumes (done) {
    const dataDir = `${this.persistenceDir}data/`
    mkdirp(dataDir, (err) => {
      if (err) return done(err)
      done(null, {
        '/data': dataDir
      })
    })
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from '${componentContainer.component.name}' to '${this.resource.name}'`)
    const params = {
      endpoint: `http://${this.name}:9000`,
      bucket: this.name.toLowerCase()
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }

  start (done) {
    super.start((err) => {
      if (err) return done(err)
      const setupContainer = new Container(this.devServer, 'S3Setup', 'job')
      setupContainer.outputLogs = false
      setupContainer.daemon = false
      setupContainer.getImage = () => { return 'amazon/aws-cli:latest' }
      setupContainer.getEnv = () => {
        return {
          AWS_ACCESS_KEY_ID: 'ABCDEF',
          AWS_SECRET_ACCESS_KEY: '1234567890'
        }
      }
      setupContainer.cmd = ['s3', '--endpoint-url', `http://${this.name}:9000`, '--region', 'local', 'mb', `s3://${this.name.toLowerCase()}`]
      setupContainer.start(done)
    })
  }
}

module.exports = S3Container
