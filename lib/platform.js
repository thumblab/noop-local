const fs = require('fs')
const os = require('os')
const async = require('async')

const credentialFile = os.homedir() + '/.noop/credentials.json'

class Platform {
  constructor (apiEndpoint) {
    this.apiEndpoint = apiEndpoint || 'https://alpha.noop.app'
  }

  // request (params, done) {
  //   params.baseUrl = this.apiEndpoint
  //   // TODO http error status code handling
  //   request(params, done)
  // }

  getToken (done) {
    async.auto({
      confirmFileExists: (done) => fs.stat(credentialFile, done),
      file: ['confirmFileExists', (results, done) => fs.readFile(credentialFile, done)]
    }, (err, results) => {
      if (err) return done(err)
      const json = JSON.parse(results.file)
      if (!json.token) return done(new Error('token not set'))
      done(null, json.token)
    })
  }

  saveToken (token, done) {
    async.auto({
      current: (done) => {
        fs.readFile(credentialFile, (err, data) => {
          if (err) return done(null, {})
          try {
            done(null, JSON.parse(data))
          } catch (err) {
            done(err)
          }
        })
      },
      write: ['current', (results, done) => {
        const data = results.current
        data.token = token
        fs.writeFile(credentialFile, data, done)
      }]
    }, done)
  }
}

module.exports = Platform
