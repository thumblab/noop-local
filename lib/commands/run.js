const discovery = require('@rearc/noop-discovery')
const DevServer = require('../devServer')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')
const fs = require('fs')
const Inspector = require('../inspector')

module.exports = (argv) => {
  const port = argv.port
  const verbose = argv.v
  async.auto({
    rootDir: findRootDir,
    app: ['rootDir', (results, done) => {
      discovery(results.rootDir, true, done)
    }],
    envOverrides: ['rootDir', (results, done) => {
      parseEnvOverrides(argv.e, argv.envFile, results.rootDir, done)
    }],
    devServer: ['app', 'envOverrides', (results, done) => {
      const opts = {
        http: argv.http || false,
        verbose
      }
      done(null, new DevServer(results.app, port, results.envOverrides, opts))
    }],
    inspector: ['devServer', (results, done) => {
      new Inspector(results.devServer).listen(done)
    }],
    start: ['devServer', (results, done) => results.devServer.start(done)],
    wait: ['start', (results, done) => {
      console.log(chalk.green(`Local Noop dev server running on https://localnoop.app:${results.devServer.port}`))
      console.log('Press Ctrl+C to stop...')
      const interval = setInterval(() => {}, 1000)
      process.once('SIGINT', () => {
        clearInterval(interval)
        done()
      })
    }],
    stopDevServer: ['wait', (results, done) => results.devServer.stop(done)]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    // console.log(app.routes)
    process.exit()
  })
}

function findRootDir (done) {
  gitRootDir(process.cwd()).then(rootDir => {
    if (!rootDir) {
      done(new Error('Unable to locate root of git project!'))
    } else {
      console.log(`Application root found at ${rootDir}`)
      done(null, rootDir)
    }
  })
}

function parseEnvOverrides (statements=[], files=[], rootDir, done) {
  const overrides = {'_all': {}}
  function parseOverride(line) {
    if (!line.length) return false
    const match = /^([a-zA-Z0-9-]+)\.([a-zA-Z0-9-_]+)=(.+)$/.exec(line)
    const allMatch = /^([a-zA-Z0-9-_]+)=(.+)$/.exec(line)
    if (match) {
      if (!overrides[match[1]]) overrides[match[1]] = {}
      overrides[match[1]][match[2]] = match[3]
    } else if (allMatch) {
      overrides['_all'][allMatch[1]] = allMatch[2]
    } else {
      return console.log(chalk.yellow(`Invalid env override: '${line}'`))
    }
  }
  if (typeof statements === 'string') {
    statements = [statements]
  }
  if (typeof files === 'string') {
    files = [files]
  }
  statements.forEach(parseOverride)
  async.auto({
    noopEnv: (done) => {
      const defaultFile = `${rootDir}/.noopEnv`
      fs.stat(defaultFile, (err) => {
        if (err) return done()
        console.log(`Reading default env override file ${defaultFile}`)
        fs.readFile(defaultFile, (err, data) => {
          if (err) return done(err)
          data.toString().split('\n').forEach(parseOverride)
          done()
        })
      })
    },
    files: (done) => {
      async.each(files, (file, done) => {
        const path = (file.indexOf('/') === 0) ? file : `${rootDir}/${file}`
        fs.readFile(path, (err, data) => {
          if (err) return done(new Error(`Unable to read override file ${path}`))
          data.toString().split('\n').forEach(parseOverride)
          done()
        })
      }, done)
    }
  }, (err) => done(err, overrides))
} 