const Container = require('./container')
const tarfs = require('tar-fs')
// const async = require('async')
const path = require('path')
const Docker = require('dockerode')
// const chalk = require('chalk')
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
      this.hostPortMappings.push({ container: 81, host: this.devServer.port })
    } else {
      this.hostPortMappings.push({ container: 82, host: this.devServer.port })
    }
  }

  getImage () {
    return 'noop/router'
  }

  getEnv () {
    const env = {
      CERTIFICATE_CHAIN: this.devServer.certificateChain,
      CERTIFICATE_KEY: this.devServer.certificateKey,
      ROUTES: JSON.stringify(this.devServer.app.routes.map((route) => {
        return {
          method: route.method,
          pattern: route.pattern,
          componentName: route.component.name,
          hostname: `noop-${route.component.app.id}-component-${route.component.name}`,
          port: route.component.settings.port,
          internal: route.private
        }
      }))
    }
    if (this.devServer.cors) env.CORS = 'true'
    return env
  }

  getVolumes (done) {
    const dir = os.homedir() + `/.noop/apps/${this.devServer.app.id}`
    done(null, {
      '/app': dir
    })
  }

  build (done) {
    this.buildStart = new Date()
    console.log('Building \'localapp\' router container...')
    const pack = tarfs.pack(path.join(__dirname, '/../router'))
    docker.buildImage(pack, { t: 'noop/router' }, (err, output) => {
      if (err) {
        this.buildEnd = new Date()
        console.error('Router build error', err)
        return done(err)
      }
      docker.modem.followProgress(output, (err) => {
        this.buildEnd = new Date()
        if (err) {
          this.buildEnd = new Date()
          console.error('Router build error', err)
          return done(err)
        }
        const duration = (this.buildEnd.getTime() - this.buildStart.getTime()) / 1000
        console.log(`Build completed for 'localapp' router in ${duration}s`)
        done()
      })
    })
  }
}

module.exports = RouterContainer
