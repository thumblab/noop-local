const methodRoutePattern = /^(ALL|GET|POST|DELETE|PUT) (\/.*)$/
const routePattern = /^\//

class Route {
  constructor (routeString, hostname, component) {
    this.hostname = hostname
    this.component = component
    if (methodRoutePattern.test(routeString)) {
      const match = methodRoutePattern.exec(routeString)
      this.method = match[1]
      this.path = match[2]
    } else if (routePattern.test(routeString)) {
      this.method = 'ALL'
      this.path = routeString
    } else {
      throw new Error('Invalid ROUTE directive')
    }
  }
}

module.exports = Route
