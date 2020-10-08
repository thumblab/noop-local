const async = require('async')
const Network = require('./network')
const RouterContainer = require('./routerContainer')
const RouterInterface = require('./routerInterface')
const ComponentContainer = require('./componentContainer')
const chalk = require('chalk')
const { schedule, validate } = require('node-cron')
const tarfs = require('tar-fs')
const path = require('path')
const Docker = require('dockerode')
const request = require('request')
const fs = require('fs')
const moment = require('moment')

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
    this.crons = []
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
      let ResourceConstructor
      try {
        ResourceConstructor = require(`./resources/${resource.type}`)
      } catch (err) {
        console.log(chalk.red(`Unsupported resource type '${resource.type}'`))
        return null
      }
      return new ResourceConstructor(resource, this)
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
      routerInterface: ['startRouter', 'beforeStartingServicesTasks', (results, done) => {
        this.routerInterface.start(done)
      }],
      startRouter: ['network', 'buildRouter', (results, done) => {
        this.router.start(done)
      }],
      buildStatic: ['buildRouter', (results, done) => {
        const pack = tarfs.pack(path.join(__dirname, '/static'))
        docker.buildImage(pack, { t: 'noop/static' }, (err, output) => {
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
      beforeStartingServicesTasks: ['setupRelationships', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return (componentContainer.component.type === 'task' && componentContainer.component.settings.lifecycles.includes('beforeStartingServices'))
        })
        async.eachSeries(containers, (container, done) => {
          console.log(`Starting beforeStartingServices task '${container.friendlyName}'`)
          container.once('end', (statusCode) => {
            if (statusCode) return done(new Error(`Error running beforeStartingServices task '${container.friendlyName}'`))
            console.log(`beforeStartingServices task '${container.friendlyName}' completed successfully`)
            done()
          })
          container.start()
        }, done)
      }],
      startComponents: ['beforeStartingServicesTasks', 'buildStatic', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return !(componentContainer.component.type === 'task')
        })
        async.each(containers, (container, done) => container.start(done), done)
      }],
      beforeTrafficDelay: ['startComponents', (results, done) => {
        setTimeout(() => done(), 1000)
      }],
      beforeTrafficTasks: ['beforeTrafficDelay', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return (componentContainer.component.type === 'task' && componentContainer.component.settings.lifecycles.includes('beforeTraffic'))
        })
        async.eachSeries(containers, (container, done) => {
          console.log(`Starting beforeTraffic task '${container.friendlyName}'`)
          container.once('end', (statusCode) => {
            if (statusCode) return done(new Error(`Error running beforeTraffic task '${container.friendlyName}'`))
            console.log(`beforeTraffic task '${container.friendlyName}' completed successfully`)
            done()
          })
          container.start()
        }, done)
      }],
      startCronTasks: ['startComponents', (results, done) => {
        const containers = this.componentContainers.filter((componentContainer) => {
          return (componentContainer.component.type === 'task' && componentContainer.component.settings && componentContainer.component.settings.cron)
        })
        async.each(containers, (container, done) => {
          console.log(`Setting cron schedule for task '${container.friendlyName}'`)
          const settings = container.component.settings.cron
          const pattern = `${settings.minute} ${settings.hour} ${settings.day} ${settings.month} ${settings.weekday}`
          if (!validate(pattern)) return done(new Error(`Invalid cron pattern for task '${container.friendlyName}'`))
          const cron = schedule(pattern, this.handleCron.bind(this, container))
          cron.container = container
          this.crons.push(cron)
          done()
        }, done)
      }],
      watchForChanges: ['startComponents', (results, done) => {
        if (!this.reloading) {
          this.app.on('componentChange', this.reloadComponent.bind(this))
          this.app.on('manifestChange', this.reload.bind(this))
        }
        done()
      }]
    }, done)
  }

  stop (done) {
    console.log('Stopping local dev server')
    async.auto({
      stopRouter: (done) => this.router.stop(done),
      stopComponents: (done) => {
        async.each(this.componentContainers, (container, done) => container.stop(done), done)
      },
      stopResources: (done) => {
        async.each(this.resourceContainers, (container, done) => container.stop(done), done)
      },
      stopCrons: (done) => {
        async.each(this.crons, (cron, done) => this.stopCron(cron, done), done)
      }
    }, done)
  }

  handleCron (container) {
    const time = moment().format('HH:mm:ss')
    console.log(`Running task '${container.friendlyName}' on cron schedule - start: ${time})`)
    container.once('end', (statusCode) => {
      if (statusCode) {
        console.log(chalk.red(`Error running cron task '${container.friendlyName}' - start: ${time}, end: ${moment().format('HH:mm:ss')}`))
      }
      console.log(`Cron task '${container.friendlyName}' completed successfully - start: ${time}, end: ${moment().format('HH:mm:ss')}`)
    })
    container.start()
  }

  stopCron (cron, done) {
    cron.destroy()
    console.log(`Removed cron schedule for '${cron.container.friendlyName}' container`)
    done()
  }

  manualTaskRun (container) {
    const time = moment().format('HH:mm:ss')
    console.log(`Manually Running task '${container.friendlyName}' - start: ${time})`)
    container.once('end', (statusCode) => {
      if (statusCode) {
        console.log(chalk.red(`Error running task '${container.friendlyName}' - start: ${time}, end: ${moment().format('HH:mm:ss')}`))
      }
      console.log(`Task '${container.friendlyName}' completed successfully - start: ${time}, end: ${moment().format('HH:mm:ss')}`)
    })
    container.start()
  }

  reload (file) {
    if (!this.reloading) {
      console.log(`Change detected in '${file}'. Reloading...`)
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
        }],
        finish: ['start', (results, done) => {
          this.reloading = false
          console.log('Reload completed for local dev server')
          done()
        }]
      }, (err) => {
        if (err || this.reloading) {
          this.reloading = false
          if (err) {
            console.log(chalk.red(err.message))
            async.auto({
              stop: (done) => {
                this.stop(done)
              },
              exit: ['stop', (results, done) => {
                process.exit()
              }]
            })
          }
        }
      })
    }
  }

  reloadComponent (componentName) {
    if (!this.reloading) {
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
          if (err) {
            console.log(chalk.red(`Error reloading component '${componentName}' container.`, err.message))
          } else {
            console.log(`Reload completed for '${componentName}' container`)
          }
          reloadQueue.shift()
          if (reloadQueue.length) this.reloadComponent(reloadQueue[0])
        })
      } else {
        console.log(`Change detected to '${componentName}' component. Reload enqueued.`)
      }
    }
  }

  refreshCertificates (done) {
    const url = 'https://noop-local.s3.amazonaws.com/certificates/localnoop.app/latest.json'
    const cacheDir = path.resolve(__dirname, '../cache')
    const cacheFile = path.resolve(cacheDir, 'certificate.json')
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)
    request({ url, timeout: 5000 }, (err, res, body) => {
      if (res && res.statusCode > 200) err = new Error(`Invalid response retrieving certificate [${res.statusCode}]`)
      if (err) {
        console.log(`Unable to refresh local certificates, using cache. ${err.message}`)
        fs.readFile(cacheFile, (err, data) => {
          if (err) return done(new Error('Error preparing local server certificates.'))
          try {
            const json = JSON.parse(data)
            this.certificateChain = Buffer.from(json.chain, 'base64').toString()
            this.certificateKey = Buffer.from(json.key, 'base64').toString()
            done()
          } catch (err) {
            done(err)
          }
        })
      } else {
        try {
          const json = JSON.parse(body)
          this.certificateChain = Buffer.from(json.chain, 'base64').toString()
          this.certificateKey = Buffer.from(json.key, 'base64').toString()
          console.log(`Caching certificate to '${cacheFile}'`)
          fs.writeFile(cacheFile, JSON.stringify(json), done)
        } catch (err) {
          done(err)
        }
      }
    })
  }
}

module.exports = DevServer
