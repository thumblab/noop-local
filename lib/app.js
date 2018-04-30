const recursive = require('recursive-readdir')
const path = require('path')
const async = require('async')
const crypto = require('crypto')
const Network = require('./network')
const Router = require('./router')
const filewatcher = require('filewatcher')

const Manifest = require('./manifest')

class App {
  constructor (root, port) {
    this.root = root
    this.id = crypto.createHash('sha256').update(root).digest('hex').substr(0, 8)
    this.network = new Network(this.id)
    this.port = port || 1234
    this.router = new Router(this)
    this.fileWatcher = filewatcher()
    this.manifests = []
    this.components = []
    this.routes = []
    this.reloading = false
  }

  discover (done) {
    recursive(this.root, (err, files) => {
      if (err) return done(err)
      const manifestFiles = files.filter((file) => {
        const pathInfo = path.parse(file)
        return (pathInfo.base === 'Noopfile')
      })
      async.each(manifestFiles, (manifestFile, done) => {
        const manifest = new Manifest(manifestFile, this)
        this.manifests.push(manifest)
        manifest.discover(done)
      }, done)
    })
  }

  start (done) {
    async.auto({
      build: (done) => {
        async.eachLimit(this.components, 1, (component, done) => {
          component.build(done)
        }, done)
      },
      network: (done) => this.network.ensure(done),
      buildRouter: (done) => this.router.build(done),
      startRouter: ['network', 'buildRouter', (results, done) => {
        this.router.start(done)
      }],
      startComponents: ['startRouter', (results, done) => {
        async.each(this.components, (component, done) => component.start(done), done)
      }]
    }, (err) => {
      if (err) return done(err)
      this.fileWatcher.removeAll()
      this.manifests.forEach((manifest) => this.fileWatcher.add(manifest.path))
      this.fileWatcher.on('change', (file) => {
        this.reload(file, (err) => {
          if (err) return console.log(`Error reloading Noop local application server`, err)
        })
      })
      done()
    })
  }

  stop (done) {
    async.auto({
      stopRouter: (done) => this.router.stop(done),
      stopComponents: (done) => {
        async.each(this.components, (component, done) => component.stop(done), done)
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
}

module.exports = App
