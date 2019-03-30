const Express = require('express')
const app = Express()
const expressWs = require('express-ws')(app)
const stream = require('stream')
let server

class Inspector {
  constructor (devServer) {
    this.server = devServer
    server = devServer
  }

  listen (done) {
    const port = this.server.inspectorPort || 1235
    app.listen(port, done)
  } 
}

app.use(Express.json())

app.get('/api/app', (req, res) => {
  res.json({
    id: server.app.id,
    root: server.app.rootPath,
    docker: {
      network: server.network.id
    }
  })
})

app.get('/api/components', (req, res) => {
  const components = server.componentContainers.map((container) => {
    return {
      id: container.component.name,
      type: container.component.type,
      root: container.component.rootPath,
      container: {
        image: container.getImage(),
        name: container.name,
        dockerfile: container.component.dockerfile
      }
    }
  })
  res.json(components)
})

app.get('/api/components/:component/build', (req, res) => {
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return res.sendStatus(404)
  const output = (container.staticBuilder) ? container.staticBuilder.buildOutput : container.buildOutput
  const start = (container.staticBuilder) ? container.staticBuilder.buildStart : container.buildStart
  const end = (container.staticBuilder) ? container.staticBuilder.buildEnd : container.buildEnd
  res.json({
    start,
    end,
    output
  })
})

app.get('/api/components/:component/logs', (req, res) => {
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return res.sendStatus(404)
  res.json(container.logs)
})

app.ws('/api/components/:component/logs', (ws, req) => {
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return ws.close(404)
  ws.send(JSON.stringify(container.logs))
  const listener = (events) => {
    ws.send(JSON.stringify(events))
  }
  container.on('logs', listener)
  ws.onclose(() => container.removeListener('logs', listener))
})

app.get('/api/components/:component/variables', (req, res) => {
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return res.sendStatus(404)
  res.json(container.getEnvInheritance())
})

app.put('/api/components/:component/variables/:key', (req, res) => {
  const key = req.params.key
  const value = req.body.value
  if (!value) return res.send(400)
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return res.sendStatus(404)
  container.inspectorEnvOverrides[key] = value
  container.stop((err) => {
    if (err) console.log('Error restarting container', err)
    container.start()
  })
  res.sendStatus(200)
})

app.delete('/api/components/:component/variables/:key', (req, res) => {
  const container = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!container) return res.sendStatus(404)
  delete container.inspectorEnvOverrides[key]
  container.stop((err) => {
    if (err) console.log('Error restarting container', err)
    container.start()
  })
  res.sendStatus(200)
})

app.ws('/api/components/:component/terminal', (ws, req) => {
  const component = server.componentContainers.find((container) => {
    return container.component.name === req.params.component
  })
  if (!component) return ws.close(404)
  const execOpts = {
    Cmd: ['/bin/sh'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Detach: false
  }
  component.container.exec(execOpts, (err, exec) => {
    if (err) return ws.close(4002)
    exec.start({stdin: true}, (err, dockerStream) => {
      if (err) return ws.close(4001)
      const fauxStdout = {
        write(payload) {
          ws.send(JSON.stringify({s: 'stdout', d: payload.toString('base64')}))
        }
      }
      const fauxStderr = {
        write(payload) {
          ws.send(JSON.stringify({s: 'stderr', d: payload.toString('base64')}))
        }
      }
      component.container.modem.demuxStream(dockerStream, fauxStdout, fauxStderr)
      ws.on('message', (msg) => {
        console.log(msg)
        dockerStream.req.write(msg + '\n')
      })
    })
  })
  // ws.onclose(() => container.removeListener('logs', listener))
})

module.exports = Inspector
