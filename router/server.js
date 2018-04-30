const express = require('express')
const app = express()
const routes = (process.env.ROUTES) ? JSON.parse(process.env.ROUTES) : []
const request = require('request')

routes.sort((a, b) => {
  return a.path.length < b.path.length
})

routes.forEach((route) => {
  app[route.method.toLowerCase()](route.path, (req, res) => {
    const startTime = new Date().getTime()
    const options = {
      uri: `http://${route.hostname}${req.path}`,
      port: 80,
      method: req.method
    }
    request(options, (err, proxyRes, body) => {
      const duration = (new Date().getTime() - startTime) + 'ms'
      if (err) {
        console.log(req.method, req.path, route.component, duration, 504, err.code)
        return res.status(500).end('Noop local application router error: ' + err.code)
      }
      res.status(proxyRes.statusCode).set(proxyRes.headers).end(body)
      console.log(
        req.method,
        req.path,
        route.component,
        duration,
        proxyRes.statusCode
      )
    })
  })
})

app.listen(80)
