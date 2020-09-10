const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

module.exports = (argv) => {
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

function formatOutput (app) {
  return JSON.stringify(app, null, 2)
}
