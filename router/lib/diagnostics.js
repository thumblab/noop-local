const expressWs = require('express-ws')
const express = require('express')
const request = require('request')

class DiagnosticsInterface {
  constructor (proxies) {
    this.proxies = proxies
    this.app = express()
    this.init()
  }

  init () {
    this.app.use(express.json())
    expressWs(this.app)
    this.app.ws('/_noop', (ws, req) => {
      const requestHandler = (request) => ws.send(JSON.stringify(request))
      this.proxies.forEach((proxy) => {
        proxy.addListener('request', requestHandler)
      })
      ws.on('close', () => {
        this.proxies.forEach((proxy) => {
          proxy.removeListener('request', requestHandler)
        })
      })
    })

    this.app.post('/_noop/events/localapp', (req, res) => {
      this.sendDiagnosticRequest(83, req, res)
    })

    this.app.post('/_noop/events/public', (req, res) => {
      this.sendDiagnosticRequest(84, req, res)
    })
  }

  listen (port) {
    this.app.listen(port)
  }

  sendDiagnosticRequest (port, req, res) {
    const diagRequestOpts = {
      uri: `http://localhost:${port}${req.body.path}`,
      headers: req.body.headers || {},
      method: req.body.method || 'GET'
    }
    if (req.body.body) diagRequestOpts.body = new Buffer(JSON.stringify(req.body.body), 'base64')
    request(diagRequestOpts, (err, diagResponse, body) => {
      if (err) {
        res.json({
          headers: {},
          statusCode: 500,
          statusMessage: err.message,
          body: null
        })
      } else {
        if (typeof body === 'string') body = new Buffer(body).toString('base64')
        res.json({
          headers: diagResponse.headers,
          statusCode: diagResponse.statusCode,
          statusMessage: diagResponse.statusMessage,
          body: body || null
        })
      }
    })
  }
}

module.exports = DiagnosticsInterface
