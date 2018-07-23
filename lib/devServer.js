const async = require('async')
const Network = require('./network')
const Router = require('./router')
const ComponentContainer = require('./componentContainer')
const reloadQueue = []

class DevServer {
  constructor (app, port) {
    this.app = app
    this.port = port || 1234
    this.network = new Network(`noop/app/${this.app.id}`)
    this.router = new Router(this)
    this.reloading = false
    this.componentContainers = Object.keys(app.components).map((componentName) => {
      return new ComponentContainer(app.components[componentName], this.network)
    })
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
      startComponents: ['startRouter', (results, done) => {
        async.each(this.componentContainers, (container, done) => container.start(done), done)
      }],
      watchForChanges: ['startComponents', (results, done) => {
        this.app.on('componentChange', this.reloadComponent.bind(this))
        done()
      }]
    }, done)
  }

  stop (done) {
    async.auto({
      stopRouter: (done) => this.router.stop(done),
      stopComponents: (done) => {
        async.each(this.componentContainers, (container, done) => container.stop(done), done)
      }
    }, done)
  }

  reload (file, done) {
    if (this.reloading) return done()
    this.reloading = true
    console.log(`Restarting Noop local application server after change detected to ${file}`)
    async.auto({
      stop: (done) => this.stop(done),
      discover: ['stop', (results, done) => {
        this.manifests = []
        this.components = []
        this.routes = []
        this.discover(done)
      }],
      start: ['discover', (results, done) => this.start(done)]
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
