const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const rimraf = require('rimraf')
const os = require('os')

module.exports = (argv) => {
  if (!argv.resource.length) return console.log(chalk.red('Missing operand \'resource\''))
  const selectedResources = argv.resource
  const root =
    typeof argv.rootPath === 'string'
      ? path.resolve(
        path.isAbsolute(argv.rootPath) ? '' : process.cwd(),
        argv.rootPath
      )
      : undefined
  async.auto({
    rootDir: (done) => {
      if (root) {
        fs.access(root, (err) => {
          if (err) {
            done(new Error('Root path could not be found!'))
          } else {
            done(null, root)
          }
        })
      } else {
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
      }
    },
    app: ['rootDir', (results, done) => {
      console.log(`Application root found at '${results.rootDir}'`)
      discovery(results.rootDir, false, done)
    }],
    clear: ['app', (results, done) => {
      if (!results.app.manifests.length) return done(new Error(`Didn't find any Noopfiles in '${results.rootDir}'`))
      selectedResources.forEach(resourceName => {
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
            console.log(`Resource '${resourceName}' was already empty`)
          }
        })
      })
    }]
  }, (err) => {
    if (err) return console.log(chalk.red(err.message))
  })
}
