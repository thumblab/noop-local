const discovery = require('@rearc/noop-discovery')
const DevServer = require('../devServer')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')

module.exports = (argv) => {
  async.auto({
    rootDir: findRootDir,
    app: ['rootDir', (results, done) => {
      discovery(results.rootDir, true, done)
    }],
    devServer: ['app', (results, done) => {
      done(null, new DevServer(results.app))
    }],
    start: ['devServer', (results, done) => results.devServer.start(done)],
    wait: ['start', (results, done) => {
      console.log(chalk.green(`Local Noop dev server running on localhost:${results.devServer.port}`))
      console.log('Press Ctrl+C to stop...')
      const interval = setInterval(() => {}, 1000)
      process.once('SIGINT', () => {
        clearInterval(interval)
        done()
      })
    }],
    stopDevServer: ['wait', (results, done) => results.devServer.stop(done)]
  }, (err, results) => {
    if (err) return console.error(err)
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
