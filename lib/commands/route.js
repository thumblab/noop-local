const discovery = require('@rearc/noop-discovery')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')
const pathToRegexp = require('path-to-regexp')

module.exports = (argv) => {
  const method = argv.method
  const path = argv.path
  if (!method) return console.log(chalk.red('Missing operand \'method\''))
  if (!path) return console.log(chalk.red('Missing operand \'path\''))
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
    route: ['app', (results, done) => {
      const routes = results.app.routes.map((route) => {
        return {
          component: route.component.name,
          method: route.method,
          pattern: pathToRegexp(route.pattern)
        }
      })
      const matchingRoute = routes.find((route) => {
        if (route.method !== method) return false
        return route.pattern.test(path)
      })
      
      done(null, matchingRoute)
    }]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    if (results.route) {
      console.log('Plan for ' + chalk.cyan(`${method} ${path}`) + ' routes to ' + chalk.cyan(results.route.component))
    } else {
      console.log('No route match for ' + chalk.cyan(`${method} ${path}`))
    }
  })
}