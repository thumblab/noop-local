const ResourceContainer = require('../ResourceContainer')
const mkdirp = require('mkdirp')
const fs = require('fs')

class S3Container extends ResourceContainer {
  getImage () {
    return 'scality/s3server:latest'
  }

  getEnv () {
    return {
      SCALITY_ACCESS_KEY_ID: 'noop',
      SCALITY_SECRET_ACCESS_KEY: 'secret'
    }
  }

  getVolumes (done) {
    this.writeConfigFiles((err) => {
      if (err) return done(err)
      done(null, {
        '/usr/src/app/config.json': `${this.persistenceDir}config/config.json`,
        '/usr/src/app/locationConfig.json': `${this.persistenceDir}config/locationConfig.json`
      })
    })
  }

  setupRelationship (componentContainer, done) {
    console.log(`Creating relation from '${componentContainer.component.name}' to '${this.resource.name}'`)
    const params = {
      accessKey: 'noop',
      secretKey: 'secret',
      endpoint: `http://${this.name}:8000`,
      bucket: 's3server'
    }
    componentContainer.dynamicParams.resources[this.friendlyName] = params
    done(null)
  }

  writeConfigFiles (done) {
    const configFile = `${this.persistenceDir}config/config.json`
    const locationConfigFile = `${this.persistenceDir}config/locationConfig.json`
    const config = {
      port: 8000,
      listenOn: [],
      replicationGroupId: 'RG001',
      restEndpoints: {
        s3server: 'local'
      },
      websiteEndpoints: [],
      replicationEndpoints: [{
        site: 'zenko',
        servers: ['127.0.0.1:8000'],
        default: true
      }, {
        site: 'us-east-2',
        type: 'aws_s3'
      }],
      backbeat: {
        host: 'localhost',
        port: 8900
      },
      cdmi: {
        host: 'localhost',
        port: 81,
        path: '/dewpoint',
        readonly: true
      },
      bucketd: {
        bootstrap: ['localhost']
      },
      vaultd: {
        host: 'localhost',
        port: 8500
      },
      clusters: 1,
      log: {
        logLevel: 'debug',
        dumpLevel: 'error'
      },
      healthChecks: {
        allowFrom: ['127.0.0.1/8', '::1']
      },
      metadataClient: {
        host: 'localhost',
        port: 9990
      },
      dataClient: {
        host: 'localhost',
        port: 9991
      },
      metadataDaemon: {
        bindAddress: 'localhost',
        port: 9990
      },
      dataDaemon: {
        bindAddress: 'localhost',
        port: 9991
      },
      recordLog: {
        enabled: true,
        recordLogName: 's3-recordlog'
      },
      mongodb: {
        replicaSetHosts: 'localhost:27018,localhost:27019,localhost:27020',
        writeConcern: 'majority',
        replicaSet: 'rs0',
        readPreference: 'primary',
        database: 'metadata'
      }
    }
    const locationConfig = {
      'us-east-1': {
        type: 'file',
        legacyAwsBehavior: true,
        details: {}
      },
      local: {
        type: 'file',
        legacyAwsBehavior: false,
        details: {}
      }
    }
    config.restEndpoints[this.name] = 'local'
    const dataDir = `${this.persistenceDir}config/`
    mkdirp(dataDir, (err) => {
      if (err) return done(err)
      fs.writeFile(configFile, JSON.stringify(config), (err) => {
        if (err) return done(err)
        fs.writeFile(locationConfigFile, JSON.stringify(locationConfig), done)
      })
    })
  }
}

module.exports = S3Container
