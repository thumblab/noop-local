#!/usr/bin/env node
process.title = 'noop'
const cli = require('yargs')
const debug = (process.env.DEBUG === 'true')
const version = require('./package.json').version

const runCommand = require('./lib/commands/run')
const inspectCommand = require('./lib/commands/inspect')
const resetCommand = require('./lib/commands/reset')
const routeCommand = require('./lib/commands/route')

console.log(`Noop CLI v${version}`)

cli.command('run [port]', 'run local dev server', (yargs) => {
  yargs.positional('port', {
    describe: 'port to bind local dev server',
    default: 1234
  })
}, runCommand)

cli.command('inspect', 'inspect noop app', inspectCommand)

cli.command('reset [resourceName]', 'reset resource state', (yargs) => {
  yargs.positional('resourceName', {
    describe: 'name of resource to reset state'
  })
}, resetCommand)

cli.command('route [method] [path]', 'evaluate routing of a specific request', (yargs) => {
  yargs.positional('method', {
    describe: 'HTTP method for evaluation (GET, PUT, POST, DELETE)'
  }),
  yargs.positional('path', {
    describe: 'HTTP path for evaluation like /foo/bar'
  })
}, routeCommand)

const argv = cli.argv // no idea wtf reading `argv` props does to make it work
if (debug) console.log(argv)
