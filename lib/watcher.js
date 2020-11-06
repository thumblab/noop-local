const path = require('path')
const chokidar = require('chokidar')
const async = require('async')
const fs = require('fs')
const ignore = require('ignore')

class Watcher {
  constructor (devServer) {
    this.devServer = devServer
    this.ignoreFiles = devServer.app.ignoreFiles
    this.components = devServer.app.components
    this.rootPath = devServer.app.rootPath
    this.selectedComponents = devServer.selectedComponents
    this.autoReload = devServer.autoReload
    this.watcher = null
    this.ignoring = {}
    this.watching = {}
  }

  setup (done) {
    async.auto({
      parseIgnores: (done) => {
        async.each(this.ignoreFiles, (file, done) => {
          this.parseIgnore(file, done)
        }, done)
      },
      parseComponents: (done) => {
        async.each(this.selectedComponents, (component, done) => {
          this.parseComponent(component, done)
        }, done)
      },
      watch: ['parseIgnores', 'parseComponents', (results, done) => {
        if (this.autoReload) {
          this.watch(done)
        } else {
          done()
        }
      }]
    }, done)
  }

  refresh (done) {
    if (this.watcher) {
      this.watcher.close().then(() => {
        this.watcher = null
        this.ignoring = {}
        this.watching = {}
        this.setup(done)
      })
    } else {
      this.setup(done)
    }
  }

  parseIgnore (file, done) {
    fs.readFile(file, (err, data) => {
      if (err) return done(err)
      const lines = new Set()
      data.toString().split(/\r?\n/).forEach(line => {
        const trimmed = line.trim()
        if (trimmed.length && !trimmed.startsWith('#')) {
          lines.add(trimmed)
        }
      })
      if (lines.size > 0) {
        this.ignoring[`${path.parse(file).dir}/`] = ignore().add(Array.from(lines))
      }
      done()
    })
  }

  parseComponent (componentName, done) {
    const lines = new Set()
    let watchAll = false
    const { name, rootPath, directives } = this.components[componentName]
    directives.forEach(directive => {
      if (!watchAll && (directive.cmd === 'ADD' || directive.cmd === 'COPY')) {
        if (directive.args[0] === '.' || directive.args[0] === './') {
          watchAll = true
        } else {
          lines.add(directive.args[0])
        }
      }
    })
    if (lines.size) {
      const ig = ignore().add(watchAll ? '*' : Array.from(lines))
      if (rootPath in this.watching) {
        this.watching[rootPath][name] = ig
      } else {
        this.watching[rootPath] = { [name]: ig }
      }
    }
    done()
  }

  watch (done) {
    this.watcher = chokidar.watch(this.rootPath, {
      ignored: (path) => {
        const ignoreStatus = this.checkIgnoreStatus(path)
        if (typeof ignoreStatus === 'boolean') return ignoreStatus
        const watchStatus = this.checkWatchStatus(path)
        if (typeof watchStatus === 'boolean') return watchStatus
        return true
      }
    }).on('all', (event, file) => {
      const { base } = path.parse(file)
      if (base === 'Noopfile' || base === '.gitignore') {
        this.devServer.reload(file)
      } else {
        const modifiedComponents = []
        for (const watchPath in this.watching) {
          if (file.startsWith(watchPath)) {
            for (const component in this.watching[watchPath]) {
              if (this.watching[watchPath][component].ignores(file.slice(watchPath.length))) {
                modifiedComponents.push(this.components[component].name)
              }
            }
          }
        }
        if (modifiedComponents.length) {
          modifiedComponents.forEach(component => {
            if (this.selectedComponents.includes(component)) {
              this.devServer.reloadComponent(component)
            }
          })
        }
      }
    })
    done()
  }

  checkIgnoreStatus (file) {
    const { base } = path.parse(file)
    if (file.includes('/.git/') || (new Set(['Dockerfile', '.dockerignore', '.git']).has(base))) return true
    if (file === this.rootPath || (new Set(['Noopfile', '.gitignore'])).has(base)) return false
    for (const ignorePath in this.ignoring) {
      if (file.startsWith(ignorePath) && this.ignoring[ignorePath].ignores(file.slice(ignorePath.length))) {
        return true
      }
    }
  }

  checkWatchStatus (file, componentName) {
    for (const watchPath in this.watching) {
      if (file.startsWith(watchPath)) {
        for (const component in this.watching[watchPath]) {
          if (componentName && component !== componentName) continue
          if (this.watching[watchPath][component].ignores(file.slice(watchPath.length))) {
            return false
          }
          if (componentName && component === componentName) return true
        }
      }
    }
  }
}

module.exports = Watcher
