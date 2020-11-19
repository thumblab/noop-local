const Docker = require('dockerode')
const async = require('async')
const chalk = require('chalk')
const moment = require('moment')
const EventEmitter = require('events').EventEmitter

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
})

class Container extends EventEmitter {
  constructor (devServer, friendlyName, type) {
    super()
    this.devServer = devServer
    this.network = devServer.network
    this.friendlyName = friendlyName
    this.name = (type === 'router') ? 'localapp' : `noop-${this.devServer.ns}-${type}-${friendlyName}`
    this.type = type
    this.container = docker.getContainer(this.name)
    this.desiredRunning = false
    this.restartAttempts = 0
    this.specials = []
    this.cmd = null
    this.daemon = true
    this.hostPortMappings = []
    this.outputLogs = false
    this.logColor = 'cyan'
    this.autoRebuild = true
    this.logs = []
    this.setMaxListeners(1028)
  }

  start (done) {
    const image = this.getImage()
    this.emit('start')
    this.desiredRunning = true
    if (this.component) {
      this.component.directives.filter((directive) => {
        return directive.cmd === 'SPECIAL'
      }).forEach((directive) => {
        this.specials.push(directive.params.option)
      })
    }
    async.auto({
      removeExisting: (done) => {
        this.container.inspect((err) => {
          if (err && err.statusCode === 404) {
            done() // no problem if container doesn't exit
          } else if (err) {
            done(err)
          } else {
            this.container.remove({ force: true }, done)
          }
        })
      },
      inspectImage: (done) => {
        docker.getImage(image).inspect((err) => {
          if (err && err.statusCode === 404) {
            this.pullImage(done)
          } else {
            done(err)
          }
        })
      },
      volumes: (done) => this.getVolumes(done),
      container: ['volumes', 'inspectImage', 'removeExisting', (results, done) => {
        const envMap = this.getEnv()
        const env = Object.keys(envMap).map((key) => {
          return `${key}=${envMap[key]}`
        })
        const opts = {
          AttachStdout: true,
          AttachStderr: true,
          Image: image,
          Hostname: this.name,
          name: this.name
        }
        if (results.volumes) {
          opts.Volumes = {}
          opts.HostConfig = { Binds: [] }
          Object.keys(results.volumes).forEach((volume) => {
            opts.Volumes[volume] = {}
            opts.HostConfig.Binds.push(`${results.volumes[volume]}:${volume}`)
          })
        }
        if (this.cmd) opts.cmd = this.cmd
        if (env.length) opts.Env = env
        if (this.hostPortMappings.length) {
          if (!opts.HostConfig) opts.HostConfig = {}
          opts.HostConfig.PortBindings = {}
          opts.ExposedPorts = {}
        }
        this.hostPortMappings.forEach((mapping) => {
          opts.HostConfig.PortBindings[`${mapping.container}/tcp`] = [{ HostPort: mapping.host.toString() }]
          opts.ExposedPorts[`${mapping.container}/tcp`] = {}
        })
        if (this.specials.indexOf('privileged') !== -1) {
          if (!opts.HostConfig) opts.HostConfig = {}
          opts.HostConfig.Privileged = true
        }
        docker.createContainer(opts, done)
      }],
      network: ['container', (results, done) => {
        const opts = {
          Container: this.name
        }
        if (this.resource && this.resource.type === 's3') {
          opts.EndpointConfig = { Aliases: [`${this.friendlyName}.${this.name}`.toLowerCase()] }
        }
        this.network.attachContainer(opts, done)
      }],
      output: ['container', (results, done) => this.handleOutput(done)],
      start: ['network', 'output', (results, done) => {
        console.log(`Starting '${this.friendlyName}' container`)
        results.container.start(done)
      }],
      status: ['start', (results, done) => {
        const statusCheck = (() => {
          let status = false
          return () => {
            this.container.inspect((err, data) => {
              if (err) {
                status = err
              } else if (data.State.Health) {
                if (data.State.Health.Status !== 'healthy') {
                  console.log(`Waiting for '${this.friendlyName}' to be healthy`)
                }
                status = data.State.Health.Status === 'healthy'
              } else {
                status = true
              }
            })
            return status
          }
        })()
        const statusInterval = setInterval(() => {
          const status = statusCheck()
          if (status) {
            clearInterval(statusInterval)
            typeof status === 'boolean' ? done() : done(status)
          }
        }, 3000)
      }],
      watch: ['status', (results, done) => this.watchForExit(done)]
    }, done)
  }

  stop (done) {
    this.desiredRunning = false
    this.container.inspect((err) => {
      if (err && err.statusCode === 404) {
        done()
      } else if (err) {
        done(err)
      } else {
        this.container.remove({ force: true }, err => {
          if (err) return done(err)
          this.emit('stop')
          console.log(`Stopped '${this.friendlyName}' container`)
          done()
        })
      }
    })
  }

  restart () {
    this.restartAttempts++
    if (this.restartAttempts > 10) {
      this.emit('restartFailed')
      return false
    }
    this.emit('restart')
    console.log(`Restarting '${this.friendlyName}' container attempt #${this.restartAttempts}`)
    this.start((err) => {
      if (err) console.log(chalk.red(`Unable to restart '${this.friendlyName}' container`, err.message))
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
      stream.on('data', (data) => {
        data = data.slice(8).toString().trim() // no idea why the first 8 bytes is garbage
        if (data) {
          this.log(data.replace(/\n$/, ''))
          if (this.devServer.verbose || this.outputLogs) {
            const time = chalk.gray(moment().format('HH:mm:ss'))
            data.split(/(\r\n|\r|\n)/).forEach((line) => {
              if (/\w/.test(line)) {
                const spaces = this.friendlyName.length < 16 ? ' '.repeat(16 - this.friendlyName.length) : ''
                const prefix = chalk[this.logColor](this.friendlyName.substr(0, 15))
                console.log(` ${prefix}${spaces} ${time} ${line}`)
              }
            })
          }
        }
      })
      done()
    })
  }

  log (data) {
    const log = { time: Date.now(), data }
    if (this.logs.length >= 1000) {
      this.logs.splice(0, this.logs.length - 999)
    }
    this.logs.push(log)
    this.emit('logs', log)
  }

  watchForExit (done) {
    this.container.wait((err, data) => {
      if (err) return done(err)
      if (!this.daemon) {
        this.emit('end', data.StatusCode)
        return null
      }
      if (this.desiredRunning) {
        console.log(chalk.red(`Container '${this.friendlyName}' exited with status code ${data.StatusCode}`))
        this.restart()
      }
    })
    done()
  }

  pullImage (done) {
    const image = this.getImage()
    console.log(`Pulling container image '${image}'`)
    const complete = (err) => {
      if (err) {
        console.log(chalk.red(`Error pulling container image ${image}`))
        // done(new ContainerPullError(err))
        done(new Error(err))
      } else {
        console.log(`Completed pull of container image '${image}'`)
        done()
      }
    }
    docker.createImage({ fromImage: image }, (err, output) => {
      if (err) return done(err)
      docker.modem.followProgress(output, complete, (event) => {
        // nothing to do with the output
      })
    })
  }

  getEnv () {
    return {}
  }

  getVolumes (done) {
    done(null, {})
  }
}

module.exports = Container
