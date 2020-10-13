#!/usr/bin/env node

const version = require('./package.json').version

const runCommand = require('./lib/commands/run')
const inspectCommand = require('./lib/commands/inspect')
const resetCommand = require('./lib/commands/reset')
const routeCommand = require('./lib/commands/route')
// const connectCommand = require('./lib/commands/connect')

const argv = require('yargs')
  .scriptName('noop')
  .usage('Usage:\n  $0 <command> [options]')
  .help('help').alias('help', 'h')
  .version('version', version).alias('version', 'v')
  .command('run [port]', 'Run local dev server', (yargs) => {
    yargs
      .positional('port', {
        describe: 'Port bind local dev server',
        type: 'number',
        default: 1234
      })
      .options({
        'disable-reload': {
          alias: 'd',
          type: 'boolean',
          description: 'Disable auto-reload for dev server'
        },
        envs: {
          alias: 'e',
          type: 'array',
          description: 'Runtime environment variables override'
        },
        'env-files': {
          alias: 'f',
          type: 'array',
          description: 'Specify paths to environment variable files'
        },
        components: {
          alias: 'c',
          type: 'array',
          description: 'Name of components to run'
        },
        resourceNames: {
          alias: 'r',
          type: 'array',
          description: 'Name of resources to run'
        }
      })
  }, (argv) => {
    runCommand(argv)
  })
  .command('inspect [types...]', 'Inspect noop app', (yargs) => {
    yargs
      .positional('types', {
        describe: 'Type to inspect (noopfiles, components, resources, routes)',
        type: 'array'
      })
  }, (argv) => {
    inspectCommand(argv)
  })
  .command('reset [resources...]', 'Reset resource state', (yargs) => {
    yargs
      .positional('resources', {
        describe: 'Names of resources to reset',
        type: 'array',
        demandOption: 'true'
      })
  }, (arvg) => {
    resetCommand(arvg)
  })
  .command('route [method] [path]', 'Evaluate routing of a specific request', (yargs) => {
    yargs
      .positional('method', {
        describe: 'HTTP method for evaluation (GET, PUT, POST, DELETE)',
        type: 'string',
        demandOption: 'true'
      })
      .positional('path', {
        describe: 'HTTP path for evaluation like /foo/bar',
        type: 'string',
        demandOption: 'true'
      })
  }, (arvg) => {
    routeCommand(arvg)
  })
  .options({
    verbose: {
      type: 'boolean',
      description: 'Run with verbose logging'
    }
  })
  .argv

if (!argv._.length) console.log(`noop-local v${version}`)
if (argv.verbose || process.env.DEBUG === 'true') console.log(argv)

// .command('connect [resourceId]', 'connect to platform managed resource', (yargs) => {
//   yargs.positional('resourceId', {
//     describe: 'ID of the resources you\'d like to directly connect to'
//   })
// }, (argv) => {
//   connectCommand(argv)
// })
