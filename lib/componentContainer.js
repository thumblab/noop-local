const Docker = require('dockerode')
const tarstream = require('tar-stream')
const tarfs = require('tar-fs')
const chalk = require('chalk')
const async = require('async')

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class ContainerBuildError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'ContainerBuildError'
  }
}

class ComponentContainer {
  constructor (component, network) {
    this.component = component
    this.network = network
    this.imageName = `noop/${component.app.id}/component/${component.name}`
    this.containerName = `noop-${component.app.id}-component-${component.name}`
    this.desiredRunning = false
    this.restartAttempts = 0
    this.rebuilding = false
    this.rebuildQueued = false
    this.buildOutput = []
    this.container = docker.getContainer(this.containerName)
  }

  build (done) {
    this.buildStart = new Date()
    console.log(`Building '${this.component.name}' component container...`)
    const pack = tarstream.pack()
    pack.entry({name: 'Dockerfile'}, this.component.dockerfile, (err) => {
      if (err) return done(err)
      tarfs.pack(this.component.rootPath, {pack: pack})
      const buildOpts = {t: this.imageName}
      docker.buildImage(pack, buildOpts, (err, output) => {
        if (err) return done(err)
        const complete = (err) => {
          this.buildEnd = new Date()
          if (err) {
            console.log(chalk.red(`Build failed for '${this.component.name}' component container`))
            console.log('   ', err)
            done(new ContainerBuildError(err))
          } else {
            const duration = (this.buildEnd.getTime() - this.buildStart.getTime()) / 1000
            console.log(`Build completed for '${this.component.name}' in ${duration}s`)
            done()
          }
        }
        docker.modem.followProgress(output, complete, (event) => {
          if (event.stream && /\w/.test(event.stream)) {
            let line = event.stream.trim()
            this.buildOutput.push(line)
            if (/^Step \d+\/\d+ :/.test(line)) line = chalk.cyan(line)
            console.log('   ', line.replace(/(\r\n|\r|\n)/g, '\n    '))
          }
        })
      })
    })
  }

  start (done) {
    this.desiredRunning = true
    async.auto({
      removeExisting: (done) => {
        const container = docker.getContainer(this.containerName)
        container.inspect((err) => {
          if (err && err.statusCode === 404) {
            done() // no problem if container doesn't exit
          } else if (err) {
            done(err)
          } else {
            container.remove({force: true}, done)
          }
        })
      },
      container: ['removeExisting', (results, done) => {
        const opts = {
          'AttachStdout': true,
          'AttachStderr': true,
          'Image': this.imageName,
          'Hostname': this.containerName,
          'name': this.containerName
        }
        docker.createContainer(opts, done)
      }],
      network: ['container', (results, done) => {
        this.network.attachContainer(this.containerName, done)
      }],
      output: ['container', (results, done) => this.handleOutput(done)],
      start: ['network', 'output', (results, done) => {
        console.log(`Starting '${this.component.name}' component container`)
        results.container.start(done)
      }],
      watch: ['start', (results, done) => this.watchForExit(done)]
    }, done)
  }

  stop (done) {
    this.desiredRunning = false
    this.container.remove({force: true}, (err) => {
      if (err) return done(err)
      console.log(`Stopped component '${this.component.name}' container`)
      done()
    })
  }

  restart () {
    this.restartAttempts++
    if (this.restartAttempts > 10) return false
    console.log(`Restarting component '${this.component.name}' container attempt #${this.restartAttempts}`)
    this.start((err) => {
      if (err) console.log(`Unable to restart component '${this.component.name}' container`, err)
    })
  }

  reload (done) {
    async.auto({
      build: (done) => this.build(done),
      stop: ['build', (results, done) => this.stop(done)],
      start: ['stop', (results, done) => this.start(done)]
    }, done)
  }

  handleOutput (done) {
    const opts = {
      stream: true,
      stdout: true,
      stderr: true
    }
    this.container.attach(opts, (err, stream) => {
      if (err) return done(err)
      let spaces = ''
      if (this.component.name.length < 10) {
        spaces = Array(10 - this.component.name.length).join(' ')
      }
      const prefix = chalk.cyan(this.component.name.substr(0, 10))
      stream.on('data', (data) => {
        data = data.slice(8) // no idea why the first 8 bytes is garbage
        let lines = data.toString().split(/(\r\n|\r|\n)/)
        lines.forEach((line) => {
          if (/\w/.test(line)) console.log(` ${prefix}${spaces} ${line}`)
        })
      })
      done()
    })
  }

  watchForExit (done) {
    this.container.wait((err, data) => {
      if (err) return done(err)
      if (this.desiredRunning) {
        console.log(chalk.red(`Component '${this.component.name}' exited with status code ${data.StatusCode}`))
        this.restart()
      }
    })
    done()
  }
}

module.exports = ComponentContainer
