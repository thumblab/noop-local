const discovery = require('@rearc/noop-discovery')
const async = require('async')
const gitRootDir = require('git-root-dir')
const chalk = require('chalk')

module.exports = (argv) => {
  async.auto({
    rootDir: (done) => {
      gitRootDir(process.cwd()).then(rootDir => {
        if (!rootDir) {
          done(new Error('Unable to locate root of git project!'))
        } else {
          console.log(`Application root found at ${rootDir}`)
          done(null, rootDir)
        }
      })
    },
    app: ['rootDir', (results, done) => {
      discovery(results.rootDir, false, done)
    }]
  }, (err, results) => {
    if (err) {
      console.log(chalk.red(err.message))
    } else {
      console.log(formatOutput(results.app))
    }
  })
}

function formatOutput(app) {
  return JSON.stringify({
    Application: {
      Id: app.id,
      Root: app.rootPath,
      Manifests: app.manifests.map((manifest) => {
        return {
          FilePath: manifest.filePath,
          Components: manifest.components.map((component) => { return component.name })
        }
      }),
      Components: Object.keys(app.components).map((componentName) => {
        const component = app.components[componentName]
        return {
          Name: component.name,
          Type: component.type,
          Root: component.rootPath,
          Resources: component.resources.map((resource) => { return resource.name })
        }
      }),
      Resources: Object.keys(app.resources).map((resourceName) => {
        const resource = app.resources[resourceName]
        return {
          Name: resource.name,
          Type: resource.type,
          Parameters: resource.params
        }
      }),
      Routes: app.routes.map((route) => {
        return {
          Pattern: route.pattern,
          Method: route.method,
          Internal: route.internal,
          Component: route.component.name
        }
      })
    }
  }, null, 2)
}
