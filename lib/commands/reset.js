const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const rimraf = require('rimraf')
const os = require('os')

module.exports = (argv) => {
  if (!argv.resources.length) return console.log(chalk.red('Missing operand \'resources\''))
  const selectedResource = argv.resources
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
      selectedResource.forEach(resourceName => {
        const homeDir = os.homedir()
        const dir = `${homeDir}/.noop/apps/${results.app.id}/resources/${resourceName}`
        fs.readdir(dir, (err, files) => {
          if (err) {
            console.log(chalk.red(`Resource '${resourceName}' was not found`))
          } else if (files.length) {
            rimraf(`${dir}/*`, (err) => {
              if (err) return done(err)
            })
            console.log(`Resource state reset for '${resourceName}'`)
          } else {
            console.log(chalk.red(`Resource '${resourceName}' was already empty`))
          }
        })
      })
    }]
  }, (err) => {
    if (err) return console.log(chalk.red(err.message))
  })
}
