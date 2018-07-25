const Container = require('./container')
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

class ComponentContainer extends Container {
  constructor (component, devServer) {
    const imageName = `noop/${component.app.id}/component/${component.name}`
    super(devServer, component.name, imageName, 'component')
    this.imageName = imageName
    this.component = component
    this.buildOutput = []
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

  reload (done) {
    async.auto({
      build: (done) => this.build(done),
      stop: ['build', (results, done) => this.stop(done)],
      start: ['stop', (results, done) => this.start(done)]
    }, done)
  }
}

module.exports = ComponentContainer
