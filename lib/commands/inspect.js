const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

module.exports = (argv) => {
  async.auto({
    rootDir: (done) => {
      const gitRootDir = (dir) => {
        for (const file of fs.readdirSync(dir)) {
          if (file === '.git' && fs.statSync(dir + '/' + file).isDirectory()) {
            return Promise.resolve(dir)
          }
        }
        if (dir === '/') return Promise.resolve(null)
        return gitRootDir(path.join(dir, '..'))
      }
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
