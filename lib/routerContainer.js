const Container = require('./container')
const tarfs = require('tar-fs')
const async = require('async')
const path = require('path')
const Docker = require('dockerode')
const chalk = require('chalk')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class RouterContainer extends Container {
  constructor (devServer) {
    super(devServer, 'localapp', 'router')
    this.logColor = 'magenta'
    if (this.devServer.http === true) {
      this.hostPortMappings.push({container: 80, host: this.devServer.port})
    } else {
      this.hostPortMappings.push({container: 443, host: this.devServer.port})
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
          port: route.component.port
        }
      }))
    }
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
