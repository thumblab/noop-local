const Docker = require('dockerode')
const tarfs = require('tar-fs')
const tarstream = require('tar-stream')
const chalk = require('chalk')
const async = require('async')
const Route = require('./route')
const recursive = require('recursive-readdir')
const fileMatch = require('file-match')
const filewatcher = require('filewatcher')

const dockerDirectives = ['FROM', 'RUN', 'CMD', 'ENTRYPOINT', 'COPY']
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class Component {
  constructor (directives, root, app) {
    const componentArgs = directives[0].args.split(' ')
    this.name = componentArgs[0]
    this.imageTag = `noop/${app.id}/components/${this.name}`
    this.containerName = `noop-${app.id}-components-${this.name}`
    this.container = docker.getContainer(this.containerName)
    this.type = componentArgs[1]
    this.directives = directives
    this.root = root
    this.files = []
    this.filePatterns = []
    this.fileWatcher = filewatcher()
    this.dockerfile = ''
    this.routes = []
    this.buildOutput = []
    this.app = app
    this.running = false
    this.restartAttempts = 0
    this.rebuilding = false
    this.rebuildQueued = false
  }

  discover (done) {
    this.directives.forEach((directive) => {
      if (directive.name === 'ADD' || directive.name === 'COPY') {
        this.filePatterns.push(directive.args[0])
        this.dockerfile += directive.raw + '\n'
      } else if (dockerDirectives.indexOf(directive.name) !== -1) {
        this.dockerfile += directive.raw + '\n'
      } else if (directive.name === 'ROUTE') {
        const route = new Route(directive.args, this.containerName, this.name)
        this.routes.push(route)
        this.app.routes.push(route)
      }
    })
    recursive(this.root, (err, files) => {
      if (err) return done(err)
      const filter = fileMatch(this.filePatterns)
      files.forEach((file) => {
        const relativeFile = file.substr(this.root.length + 1)
        if (filter(relativeFile)) this.files.push(file)
      })
      done()
    })
  }

  build (done) {
    this.buildStart = new Date()
    console.log(`Building '${this.name}' component container...`)
    const pack = tarstream.pack()
    pack.entry({name: 'Dockerfile'}, this.dockerfile, (err) => {
      if (err) return done(err)
      tarfs.pack(this.root, {pack: pack})
      const buildOpts = {t: this.imageTag}
      docker.buildImage(pack, buildOpts, (err, output) => {
        if (err) return done(err)
        const complete = (err) => {
          this.buildEnd = new Date()
          if (err) {
            console.log(chalk.red(`Build failed for '${this.name}' component container`))
            console.log('   ', err)
            done(new Error(err))
          } else {
            const duration = (this.buildEnd.getTime() - this.buildStart.getTime()) / 1000
            console.log(`Build completed for '${this.name}' in ${duration}s`)
            this.watchChanges(done)
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
        const opts = {
          'AttachStdout': true,
          'AttachStderr': true,
          'Image': this.imageTag,
          'Hostname': this.containerName,
          'name': this.containerName
        }
        docker.createContainer(opts, done)
      }],
      network: ['container', (results, done) => {
        this.app.network.attachContainer(this.containerName, done)
      }],
      output: ['container', (results, done) => this.handleOutput(done)],
      start: ['network', 'output', (results, done) => {
        this.running = true
        console.log(`Starting '${this.name}' component container`)
        results.container.start(done)
      }],
      watch: ['start', (results, done) => this.watchForExit(done)]
    }, done)
  }

  stop (done) {
    this.running = false
    this.fileWatcher.removeAll()
    this.container.remove({force: true}, (err) => {
      if (err) return done(err)
      console.log(`Completed cleanup of component '${this.name}' container`)
      done()
    })
  }

  restart () {
    this.restartAttempts++
    if (this.restartAttempts > 10) return false
    console.log(`Restarting component '${this.name}' container attempt #${this.restartAttempts}`)
    this.start((err) => {
      if (err) console.log(`Unable to restart component '${this.name}' container`, err)
    })
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
      if (this.name.length < 10) {
        spaces = Array(10 - this.name.length).join(' ')
      }
      const prefix = chalk.cyan(this.name.substr(0, 10))
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
      if (this.running) {
        this.running = false
        console.log(chalk.red(`Component '${this.name}' exited with status code ${data.StatusCode}`))
        this.restart()
      }
    })
    done()
  }

  watchChanges (done) {
    this.files.forEach((file) => this.fileWatcher.add(file))
    this.fileWatcher.on('change', (file) => {
      if (this.rebuilding) {
        this.rebuildQueued = file
        return done()
      }
      console.log(`Rebuilding '${this.name}' after change detected to ${file}`)
      this.rebuilding = true
      this.build((err) => {
        this.rebuilding = false
        if (err) return console.log(`Error rebuilding '${this.name}'`, err)
        if (this.running) {
          this.running = false
          this.start((err) => {
            if (err) console.log(`Unable to restart component '${this.name}' container`, err)
          })
        }
      })
    })
    done()
  }
}

module.exports = Component
