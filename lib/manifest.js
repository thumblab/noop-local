const fs = require('fs')
const parser = require('docker-file-parser')
const path = require('path')
const async = require('async')

const Component = require('./component')

class Manifest {
  constructor (filePath, app) {
    this.path = filePath
    this.app = app
    this.contents = null
    this.components = []
    this.root = path.parse(filePath).dir
  }

  discover (done) {
    fs.readFile(this.path, (err, data) => {
      if (err) return done(err)
      this.contents = data.toString()
      this.parse((err) => {
        if (err) return done(err)
        async.each(this.components, (component, done) => {
          this.app.components.push(component)
          component.discover(done)
        }, done)
      })
    })
  }

  parse (done) {
    const directives = parser.parse(this.contents)
    let componentDirectives = []
    async.eachLimit(directives, 1, (directive, done) => {
      if (directive.name === 'COMPONENT') {
        if (componentDirectives.length) {
          this.components.push(new Component(componentDirectives, this.root, this.app))
          componentDirectives = [directive]
          done()
        } else {
          componentDirectives.push(directive)
          done()
        }
      } else {
        if (componentDirectives.length) {
          componentDirectives.push(directive)
          done()
        } else {
          console.log('DIRECTIVE', directive)
          done(new Error('Missing COMPONENT directive'))
        }
      }
    }, (err, results) => {
      if (err) return done(err)
      if (componentDirectives.length) {
        this.components.push(new Component(componentDirectives, this.root, this.app))
      }
      done()
    })
  }
}

module.exports = Manifest
