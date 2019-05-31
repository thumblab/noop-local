const Container = require('./container')
const tarfs = require('tar-fs')
const async = require('async')
const path = require('path')
const Docker = require('dockerode')
const chalk = require('chalk')
const os = require('os')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class RouterContainer extends Container {
  constructor (devServer) {
    super(devServer, 'localapp', 'router')
    this.logColor = 'magenta'
    this.outputLogs = false
    this.hostPortMappings.push({
      container: 90,
      host: this.devServer.port + 2
    })
    if (this.devServer.http === true) {
      this.hostPortMappings.push({container: 81, host: this.devServer.port})
    } else {
      this.hostPortMappings.push({container: 82, host: this.devServer.port})
    }
  }

  getImage() {
    return 'noop/router'
  }

  getEnv() {
    return {
      ROUTES: JSON.stringify(this.devServer.app.routes.map((route) => {
        return {
          method: route.method,
          pattern: route.pattern,
          componentName: route.component.name,
          hostname: `noop-${route.component.app.id}-component-${route.component.name}`,
          port: route.component.port,
          internal: route.internal
        }
      }))
    }
  }

  getVolumes (done) {
    const dir = os.homedir() + `/.noop/apps/${this.devServer.app.id}`
    done(null, {
      '/app': dir
    })
  }

  build (done) {
    const pack = tarfs.pack(path.join(__dirname, '/../router'))
    docker.buildImage(pack, {t: 'noop/router'}, (err, output) => {
      if (err) return done(err)
      docker.modem.followProgress(output, done)
    })
  }
}

module.exports = RouterContainer
