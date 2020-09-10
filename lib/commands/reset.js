const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const rimraf = require('rimraf')
const os = require('os')

module.exports = (argv) => {
  const resourceName = argv.resourceName
  async.auto({
    rootDir: (done) => {
      const gitRootDir = (dir) => (
        fs.promises.readdir(dir, { withFileTypes: true })
          .then((files) => {
            for (const file of files) {
              if ((file.name === '.git') && file.isDirectory()) {
                return dir
              }
            }
            if (dir !== '/') return gitRootDir(path.resolve(dir, '..'))
          })
      )
      gitRootDir(process.cwd()).then((rootDir) => {
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
      const dir = `${homeDir}/.noop/apps/${results.app.id}/resources/${resourceName}/*`
      console.log(dir)
      rimraf(dir, done)
    }]
  }, (err) => {
    if (err) return console.log(chalk.red(err.message))
    console.log(`Resource state reset for '${resourceName}`)
  })
}
