const discovery = require('@rearc/noop-discovery')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')

module.exports = (argv) => {
  async.auto({
    rootDir: (done) => {
      gitRootDir(process.cwd()).then(rootDir => {
        if (rootDir) {
          done(null, rootDir)
        } else {
          done(new Error('Unable to locate root of git project!'))
        }
      })
    },
    app: ['rootDir', (results, done) => {
      discovery(results.rootDir, false, done)
    }]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    if (results.app.manifests.length) {
      console.log(formatOutput(results.app))
    } else {
      console.log(`Didn't find any Noopfiles in ${results.rootDir}`)
    }
  })
}

function formatOutput(app) {
  return JSON.stringify(app, null, 2)
}
