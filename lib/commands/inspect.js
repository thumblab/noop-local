const discovery = require('@rearc/noop-discovery')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')

module.exports = (argv) => {
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

function formatOutput(app) {
  return JSON.stringify({
    Application: {
      Id: app.id,
      Root: app.rootPath,
      Noopfiles: app.manifests.map((manifest) => {
        return manifest.filePath
      }),
      Components: Object.keys(app.components).map((componentName) => {
        const component = app.components[componentName]
        return {
          Name: component.name,
          Type: component.type,
          Root: component.rootPath,
          Resources: component.resources.map((resource) => { return resource.name }),
          Declaration: `${component.directives[0].file}:${component.directives[0].lineNumber}`
        }
      }),
      Resources: Object.keys(app.resources).map((resourceName) => {
        const resource = app.resources[resourceName]
        return {
          Name: resource.name,
          Type: resource.type,
          Parameters: resource.params,
          Declarations: resource.directives.map((directive) => {
            return `${directive.file}:${directive.lineNumber}`
          })
        }
      }),
      Routes: app.routes.map((route) => {
        return {
          Pattern: route.pattern,
          Method: route.method,
          Internal: route.internal,
          Component: route.component.name,
          Declaration: `${route.directive.file}:${route.directive.lineNumber}`
        }
      })
    }
  }, null, 2)
}
