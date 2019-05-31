const routes = (process.env.ROUTES) ? JSON.parse(process.env.ROUTES) : []
const Proxy = require('./lib/proxy')
const Diagnostics = require('./lib/diagnostics')

const localapp = new Proxy('internal', routes, true)
const publicInsecure = new Proxy('external', routes, false)
const publicSecure = new Proxy('external', routes, false)
const localappDebug = new Proxy('internal-debug', routes, true)
const publicDebug = new Proxy('external-debug', routes, false)

const diagnosticInterface = new Diagnostics([
  localapp,
  publicInsecure,
  publicSecure,
  localappDebug,
  publicDebug
])

localapp.listenHttp(80)
publicInsecure.listenHttp(81)
publicSecure.listenHttps(82)
localappDebug.listenHttp(83)
publicDebug.listenHttp(84)

diagnosticInterface.listen(90)
