const tarfs = require('tar-fs')
const async = require('async')
const path = require('path')
const Docker = require('dockerode')
const chalk = require('chalk')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class Router {
  constructor (devServer) {
    this.devServer = devServer
    this.containerName = 'localapp'
  }

  build (done) {
    const pack = tarfs.pack(path.join(__dirname, '/../router'))
    docker.buildImage(pack, {t: 'noop/router'}, (err, output) => {
      if (err) return done(err)
      docker.modem.followProgress(output, done)
    })
  }

  start (done) {
    console.log('Building local router container')
    async.auto({
      removeExisting: (done) => {
        const container = docker.getContainer(this.containerName)
        container.inspect((err) => {
          if (err && err.statusCode === 404) {
            done()
          } else if (err) {
            done(err)
          } else {
            container.remove({force: true}, done)
          }
        })
      },
      container: ['removeExisting', (results, done) => {
        const routeMap = this.devServer.app.routes.map((route) => {
          return {
            method: route.method,
            pattern: route.pattern,
            componentName: route.component.name,
            hostname: `noop-${route.component.app.id}-component-${route.component.name}`
          }
        })
        const routesVariable = 'ROUTES=' + JSON.stringify(routeMap)
        const opts = {
          AttachStdout: true,
          AttachStderr: true,
          Image: 'noop/router',
          Hostname: 'localapp',
          name: this.containerName,
          Env: [routesVariable],
          HostConfig: {
            PortBindings: {
              '80/tcp': [{HostPort: this.devServer.port.toString()}]
            }
          },
          ExposedPorts: {'80/tcp': {}}
        }
        docker.createContainer(opts, done)
      }],
      network: ['container', (results, done) => {
        this.devServer.network.attachContainer(this.containerName, done)
      }],
      output: ['container', (results, done) => {
        this.container = results.container
        this.handleOutput(done)
      }],
      start: ['network', (results, done) => results.container.start(done)],
      log: ['start', (results, done) => {
        console.log('Local router container running')
        done()
      }]
    }, done)
  }

  stop (done) {
    this.container.remove({force: true}, done)
  }

  handleOutput (done) {
    const opts = {
      stream: true,
      stdout: true,
      stderr: true
    }
    this.container.attach(opts, (err, stream) => {
      if (err) return done(err)
      const prefix = chalk.magenta('router   ')
      stream.on('data', (data) => {
        data = data.slice(8) // no idea why the first 8 bytes is garbage
        let lines = data.toString().split(/(\r\n|\r|\n)/)
        lines.forEach((line) => {
          if (line.trim().length) console.log(` ${prefix} ${line}`)
        })
      })
      done()
    })
  }
}

module.exports = Router
