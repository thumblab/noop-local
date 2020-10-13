const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const pathToRegexp = require('path-to-regexp')

module.exports = (argv) => {
  const method = argv.method
  const pathArg = argv.path
  if (!method) return console.log(chalk.red('Missing operand \'method\''))
  if (!pathArg) return console.log(chalk.red('Missing operand \'path\''))
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
    route: ['app', (results, done) => {
      const routes = results.app.routes.map((route) => {
        return {
          component: route.component.name,
          method: route.method,
          pattern: pathToRegexp(route.pattern.replace('*', '(.*)'))
        }
      })

      const matchingRoute = routes.find((route) => {
        if (route.method === method || route.method === 'ALL') {
          return route.pattern.test(pathArg)
        }        
        return false
      })

      done(null, matchingRoute)
    }]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    if (results.route) {
      console.log('Plan for ' + chalk.cyan(`${method} ${pathArg}`) + ' routes to ' + chalk.cyan(results.route.component))
    } else {
      console.log('No route match for ' + chalk.cyan(`${method} ${pathArg}`))
    }
  })
}
