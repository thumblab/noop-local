const discovery = require('noop-discovery')
const async = require('async')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const pathToRegexp = require('path-to-regexp')

module.exports = (argv) => {
  if (!argv.method) return console.log(chalk.red('Missing operand \'method\''))
  if (!argv.path) return console.log(chalk.red('Missing operand \'path\''))
  const method = argv.method.toUpperCase()
  const pathArg = argv.path
  const validMethods = new Set(['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'])
  if (!validMethods.has(method)) return console.log(chalk.red(`Invalid method '${method}'`))
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
    }],
    route: ['app', (results, done) => {
      if (!results.app.manifests.length) return done(new Error(`Didn't find any Noopfiles in '${results.rootDir}'`))
      const routes = results.app.routes.map((route) => {
        return {
          component: route.component.name,
          method: route.method.toUpperCase(),
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
