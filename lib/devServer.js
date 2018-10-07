const async = require('async')
const Network = require('./network')
const RouterContainer = require('./routerContainer')
const ComponentContainer = require('./componentContainer')
const chalk = require('chalk')
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
    this.loadApp()
  }

  loadApp () {
    this.router = new RouterContainer(this)
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
      buildRouter: ['build', (results, done) => this.router.build(done)],
      startRouter: ['network', 'buildRouter', (results, done) => {
        this.router.start(done)
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
      startComponents: ['setupRelationships', (results, done) => {
        async.each(this.componentContainers, (container, done) => container.start(done), done)
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
    console.log(`Restarting Noop local dev server due to Noopfile change`)
    async.auto({
      stop: (done) => this.stop(done),
      rediscover: ['stop', (results, done) => {
        this.app.reload()
      }],
      reloadApp: ['rediscover', (results, done) => {
        this.loadApp()
        done()
      }],
      start: ['reloadApp', (results, done) => this.start(done)]
    }, (err) => {
      this.reloading = false
      done(err)
    })
  }

  reloadComponent (componentName) {
    const container = this.componentContainers.find((container) => {
      return (container.component.name === componentName)
    })
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


}

module.exports = DevServer
