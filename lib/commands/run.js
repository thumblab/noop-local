const discovery = require('noop-discovery')
const DevServer = require('../devServer')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')
const fs = require('fs')
const Inspector = require('../inspector')
const exec = require('child_process').exec
const readline = require('readline')

module.exports = (argv) => {
  const port = argv.port
  const verbose = argv.v
  const cors = argv.cors
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
        verbose,
        cors
      }
      done(null, new DevServer(results.app, port, results.envOverrides, opts))
    }],
    inspector: ['devServer', (results, done) => {
      const inspector = new Inspector(results.devServer)
      inspector.listen((err) => {
        if (err) return done(err)
        done(null, inspector)
      })
    }],
    start: ['devServer', (results, done) => results.devServer.start(done)],
    wait: ['inspector', 'start', (results, done) => {
      const interval = setInterval(() => {}, 1000)
      console.log(chalk.green(`Your application dev server is running on https://localnoop.app:${results.devServer.port}`)) 
      if (process.stdin.setRawMode) {
        console.log(chalk.cyan(`Press [i] to open the inspector, [o] to open the dev server, or [q] to stop the dev server`))
        readline.emitKeypressEvents(process.stdin)
        process.stdin.setRawMode(true)
        process.stdin.on('keypress', (str, key) => {
          if (key.name === 'i') {
            exec(`open http://localhost:${results.inspector.port}`)
          } else if (key.name === 'o') {
            exec(`open https://localnoop.app:${results.devServer.port}`)
          } else if (key.name === 'q') {
            clearInterval(interval)
            done()
          }
        })
      }
    }],
    stopDevServer: ['wait', (results, done) => results.devServer.stop(done)]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
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