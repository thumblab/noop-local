const https = require('https')
const express = require('express')
const app = express()
const routes = (process.env.ROUTES) ? JSON.parse(process.env.ROUTES) : []
const fs = require('fs')
const http = require('http')
let requestCount = 0

routes.forEach((route) => {
  app[route.method.toLowerCase()](route.pattern, (clientRequest, clientResponse) => {
    const startTime = new Date().getTime()
    requestCount++
    clientRequest.requestCount = requestCount
    console.log(
      `REQ #${clientRequest.requestCount}`,
      clientRequest.method,
      clientRequest.path,
      '->',
      route.componentName
    )
    const options = {
      hostname: route.hostname,
      port: route.port,
      method: clientRequest.method,
      path: clientRequest.path,
      timeout: 5000,
      headers: clientRequest.headers
    }
    const serverRequest = http.request(options, (serverResponse) => {
      clientResponse.statusCode = serverResponse.statusCode
      clientResponse.statusMessage = serverResponse.statusMessage
      clientResponse.headers = serverResponse.headers
      // clientResponse.writeHead()
      serverResponse.on('data', (chunk) => {
        clientResponse.size += chunk.length
        clientResponse.write(chunk)
      })
      serverResponse.on('end', () => {
        logResponse()
        clientResponse.end()
      })
    })
    clientResponse.size = 0
    serverRequest.on('error', (err) => {
      clientResponse.statusCode = 500
      clientResponse.statusMessage = `NoopRouterError`
      clientResponse.write(`Noop router error: ${err.code}`)
      logResponse()
      clientResponse.end()
    })
    clientRequest.on('data', (chunk) => {
      serverRequest.write(chunk)
    })
    clientRequest.on('end', () => {
      serverRequest.end()
    })
    function logResponse () {
      const duration = (new Date().getTime() - startTime) + 'ms'
      clientResponse.end()
      console.log(
        `RES #${clientRequest.requestCount}`,
        duration,
        `${clientResponse.size}b`,
        clientResponse.statusCode,
        clientResponse.statusMessage
      )
    }
  })
})

https.createServer({
  cert: fs.readFileSync('./certificates/localnoop.app.cert'),
  key: fs.readFileSync('./certificates/localnoop.app.key')
}, app).listen(443)

app.listen(80)