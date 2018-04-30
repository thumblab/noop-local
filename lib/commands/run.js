const async = require('async')
const gitRootDir = require('git-root-dir')
const App = require('../app')
const chalk = require('chalk')

module.exports = (argv) => {
  let app
  async.auto({
    rootDir: findRootDir,
    discover: ['rootDir', (results, done) => {
      app = new App(results.rootDir)
      app.discover(done)
    }],
    start: ['discover', (results, done) => app.start(done)],
    wait: ['start', (results, done) => {
      console.log(chalk.green(`Local Noop application server running on localhost:${app.port}`))
      console.log('Press Ctrl+C to stop...')
      const interval = setInterval(() => {}, 1000)
      process.once('SIGINT', () => {
        clearInterval(interval)
        done()
      })
    }],
    stopComponents: ['wait', (results, done) => {
      console.log('\nStopping local Noop application server')
      app.stop(done)
    }]
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
