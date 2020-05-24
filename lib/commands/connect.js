const async = require('async')
const chalk = require('chalk')
const Platform = require('../platform')
const Proxy =  require('../resourceProxy')

module.exports = (argv) => {
  const platform = new Platform()
  const resourceId = argv.resourceId
  // TODO validate ID format
  async.auto({
    resource: (done) => {
      console.log(`Connecting to resource ${resourceId}`)
      done(null, {id: resourceId}) // temp
    },
    session: ['resource', (results, done) => {
      done()
    }],
    credentials: ['session', (results, done) => {
      done()
    }],
    proxy: ['credentials', (results, done) => {
      const proxy = new Proxy(results.resource, results.session, results.credentials)
      proxy.start((err) => {
        if (err) return done(err)
        done(null, proxy)
      })
    }]
  }, (err, results) => {
    if (err) return console.log(chalk.red(err.message))
    console.log(`Resource proxy server running on localhost:${results.proxy.port} for ${resourceId}`)
  })
}