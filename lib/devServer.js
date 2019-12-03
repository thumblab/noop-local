const async = require('async')
const Network = require('./network')
const RouterContainer = require('./routerContainer')
const RouterInterface = require('./routerInterface')
const ComponentContainer = require('./componentContainer')
const chalk = require('chalk')
const CronJob = require('cron').CronJob
const tarfs = require('tar-fs')
const path = require('path')
const Docker = require('dockerode')
const request = require('request')
const fs = require('fs')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})
const reloadQueue = []

class DevServer {
  constructor (app, port, envOverrides, opts) {
    this.app = app
    this.ns = app.id
    this.port = port
    this.envOverrides = envOverrides
    this.network = new Network(`noop/app/${this.ns}`)
    this.reloading = false
    this.http = opts.http || false
    this.verbose = opts.verbose
    this.cors = opts.cors
    this.certificateChain = null
    this.certificateKey = null
    this.loadApp()
  }

  loadApp () {
    this.router = new RouterContainer(this)
    this.routerInterface = new RouterInterface(this)
    this.componentContainers = Object.keys(this.app.components).map((componentName) => {
      return new ComponentContainer(this.app.components[componentName], this)
    })
    this.resourceContainers = Object.keys(this.app.resources).map((resourceName) => {
      const resource = this.app.resources[resourceName]
      let resourceConstructor
      try {
        resourceConstructor = require(`./resources/${resource.type}`)
      } catch (err) {
        console.log(chalk.red(`Unsupported resource type '${resource.type}'`))
        return null
      }
      return new resourceConstructor(resource, this)
    }).filter((resource) => { return (resource) })
  }

  start (done) {
    async.auto({
      build: (done) => {
        async.eachLimit(this.componentContainers, 1, (container, done) => {
          container.build(done)
        }, done)
      },
      network: (done) => this.network.ensure(done),
      certificate: (done) => this.refreshCertificates(done),
      buildRouter: ['build', (results, done) => this.router.build(done)],
      routerInterface: ['startRouter', 'predeployTasks', (results, done) => {
        this.routerInterface.start(done)
      }],
      startRouter: ['network', 'buildRouter', (results, done) => {
        this.router.start(done)
      }],
      buildStatic: ['buildRouter', (results, done) => {
        const pack = tarfs.pack(path.join(__dirname, '/static'))
        docker.buildImage(pack, {t: 'noop/static'}, (err, output) => {
          if (err) return done(err)
          docker.modem.followProgress(output, done)
        })
      }],
      startResources: ['startRouter', (results, done) => {
        async.each(this.resourceContainers, (container, done) => container.start(done), done)
      }],
      setupRelationships: ['startResources', (results, done) => {
        async.each(this.componentContainers, (componentContainer, done) => {
          async.each(componentContainer.component.resources, (resource, done) => {
            const resourceContainer = this.resourceContainers.find((resourceContainer) => {
              return (resourceContainer.resource.name === resource.name)
            })
            if (resourceContainer) {
              resourceContainer.setupRelationship(componentContainer, done)
            } else {
              done()
            }
          }, done)
        }, done)
      }],
      predeployTasks: ['setupRelationships', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return (componentContainer.component.type === 'task' && componentContainer.component.lifecycles.includes('predeploy'))
        })
        async.eachSeries(containers, (container, done) => {
          console.log(`Starting predeploy task '${container.friendlyName}'`)
          container.once('end', (statusCode) => {
            if (statusCode) return done(new Error(`Error running predeploy task '${container.friendlyName}'`))
            console.log( `Predeploy task '${container.friendlyName}' completed successfully`)
            done()
          })
          container.start()
        }, done)
      }],
      startComponents: ['predeployTasks', 'buildStatic', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return !(componentContainer.component.type === 'task')
        })
        async.each(containers, (container, done) => container.start(done), done)
      }],
      startCronTasks: ['startComponents', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return (componentContainer.component.type === 'task' && componentContainer.component.cron)
        })
        containers.forEach((container) => {
          // console.log(`Starting cron scheduler for task '${container.friendlyName}'`)
          const schedule = `${container.component.cron.minute} ${container.component.cron.hour} ${container.component.cron.day} ${container.component.cron.month} ${container.component.cron.weekday}`
          new CronJob(schedule, () => {
            // console.log(`Running task '${container.friendlyName} on cron schedule`)
            container.start()
            container.once('end', (statusCode) => {
              // console.log(`Cron task '${container.friendlyName}' exited with status code ${statusCode}`)
            })
          }, null, true);
        })
        done()
      }],
      watchForChanges: ['startComponents', (results, done) => {
        this.app.on('componentChange', this.reloadComponent.bind(this))
        // TODO prevent componentChange from firing on manifest change
        //this.app.on('manifestChange', this.reload.bind(this))
        done()
      }]
    }, done)
  }

  stop (done) {
    console.log('Stopping local Noop Dev Server')
    async.auto({
      stopRouter: (done) => this.router.stop(done),
      stopComponents: (done) => {
        async.each(this.componentContainers, (container, done) => container.stop(done), done)
      },
      stopResources: (done) => {
        async.each(this.resourceContainers, (container, done) => container.stop(done), done)
      }
    }, done)
  }

  reload (done) {
    if (this.reloading) return done()
    this.reloading = true
    async.auto({
      stop: (done) => this.stop(done),
      rediscover: ['stop', (results, done) => {
        this.app.reload(done)
      }],
      reloadApp: ['rediscover', (results, done) => {
        this.loadApp()
        done()
      }],
      start: ['reloadApp', (results, done) => {
        this.start(done)
      }]
    }, (err) => {
      this.reloading = false
      done(err)
    })
  }

  reloadComponent (componentName) {
    const container = this.componentContainers.find((container) => {
      return (container.component.name === componentName)
    })
    if (!container.autoRebuild) return false
    if (!container) return false
    if (reloadQueue.indexOf(componentName) === -1) {
      reloadQueue.push(componentName)
    }
    if (reloadQueue.indexOf(componentName) === 0) {
      console.log(`Change detected to '${componentName}' component. Reloading...`)
      container.reload((err) => {
        if (err) console.log(`Error reloading component '${componentName}' container.`, err.message)
        reloadQueue.shift()
        if (reloadQueue.length) this.reloadComponent(reloadQueue[0])
      })
    } else {
      console.log(`Change detected to '${componentName}' component. Reload enqueued.`)
    }
  }

  refreshCertificates (done) {
    const url = 'https://noop-local.s3.amazonaws.com/certificates/localnoop.app/latest.json'
    const cacheDir = path.resolve(__dirname, '../cache')
    const cacheFile = path.resolve(cacheDir, 'certificate.json')
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)
    request({url, timeout: 5000}, (err, res, body) => {
      if (res && res.statusCode > 200) err = new Error(`Invalid response retrieving certificate [${res.statusCode}]`)
      if (err) {
        console.log(`Unable to refresh local certificates, using cache. ${err.message}`)
        fs.readFile(cacheFile, (err, data) => {
          if (err) return done(new Error('Error preparing local server certificates.'))
          try {
            const json = JSON.parse(data)
            this.certificateChain = new Buffer(json.chain, 'base64').toString()
            this.certificateKey = new Buffer(json.key, 'base64').toString()
            done()
          } catch (err) {
            done(err)
          }
        })
      } else {
        try {
          const json = JSON.parse(body)
          this.certificateChain = new Buffer(json.chain, 'base64').toString()
          this.certificateKey = new Buffer(json.key, 'base64').toString()
          console.log(`Caching certificate to ${cacheFile}`)
          fs.writeFile(cacheFile, JSON.stringify(json), done)
        } catch (err) {
          done(err)
        }
      }
    })
  }
}

module.exports = DevServer
