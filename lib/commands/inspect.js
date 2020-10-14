const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

module.exports = (argv) => {
  const inspectTypes = argv.type
  if (typeof argv.rootPath === 'string' && path.isAbsolute(argv.rootPath)) {
    return console.log(chalk.red('Root must be relative path to current working directory'))
  }
  const root = 'rootPath' in argv ? path.resolve(process.cwd(), (argv.rootPath || '.')) : undefined
  async.auto({
    rootDir: (done) => {
      if (root) {
        fs.access(root, (err) => {
          if (err) {
            done(new Error('Root path could not be found'))
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
      discovery(results.rootDir, false, done)
    }]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    if (!results.app.manifests.length) {
      console.log(chalk.red(`Didn't find any Noopfiles in '${results.rootDir}'`))
    } else {
      const json = formatOutput(JSON.stringify(results.app, null, 2), inspectTypes)
      if (json) console.log(json)
    }
  })
}

const formatOutput = (app, inspectTypes) => {
  if (!inspectTypes.length) return app
  const filtered = JSON.parse(app)
  for (const key in filtered) {
    if (!inspectTypes.includes(key)) delete filtered[key]
  }
  if (Object.keys(filtered).length) return JSON.stringify(filtered, null, 2)
}
