const discovery = require('@rearc/noop-discovery')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')
const rimraf = require('rimraf')
const os = require('os')

module.exports = (argv) => {
  const resourceName = argv.resourceName
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
    }],
    clear: ['app', (results, done) => {
      const homeDir = os.homedir()
      const dir = `${homeDir}/apps/${results.app.id}/resources/${resourceName}/*`
      console.log(dir)
      rimraf(dir, done)
    }]
  }, (err) => {
    if (err) return console.log(chalk.red(err.message))
    console.log(`Resource state reset for '${resourceName}`)
  })
}