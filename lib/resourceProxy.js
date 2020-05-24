const tls = require('tls')
const net = require('net')

class ResourceProxy {
  constructor (resource, session, credentials) {
    this.resource = resource
    this.session = session
    this.credentials = credentials
    this.server = net.createServer(this.handleConnection.bind(this))
    this.port = null
    this.connections = []
  }

  start (done) {
    this.server.listen(0, 'localhost', (err) => {
      if (err) return done(err)
      this.port = this.server.address().port
      done()
    })
  }

  stop (done) {

  }

  handleConnection (connection) {
    console.log(this)
    this.connections.push(connection)
    console.log(`New connection to ${this.resource.id} initated`)
    const socket = tls.connect({
      ca: this.credentials.tunnel.ca,
      key: this.credentials.tunnel.key,
      cert: this.credentials.tunnel.certificate,
      host: this.credentials.tunnel.host,
      port: this.credentials.tunnel.port
    }, (err) => {
      if (err) return console.error(`Error establishing secure proxy to resource ${this.resource.id}`)
      connection.pipe(socket)
      socket.pipe(connection)
      console.log(`Secure resource proxy established to ${this.resource.id}`)
    })
  }
}

module.exports = ResourceProxy
