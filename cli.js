#!/usr/bin/env node

const runCommand = require('./lib/commands/run')
const inspectCommand = require('./lib/commands/inspect')
const resetCommand = require('./lib/commands/reset')
const routeCommand = require('./lib/commands/route')
// const connectCommand = require('./lib/commands/connect')

const argv = require('yargs')
  .scriptName('noop')
  .usage('Usage:\n  $0 <command> [options]')
  .help('help').alias('help', 'h')
  .version('version', `noop-local v${require('./package.json').version}`).alias('version', 'v')
  .command('run', 'Run local dev server', (yargs) => {
    yargs
      .options({
        port: {
          alias: 'p',
          type: 'number',
          describe: 'Port bind local dev server',
          default: 1234
        },
        'disable-reload': {
          alias: 'd',
          type: 'boolean',
          description: 'Disable auto-reload for dev server',
          default: false
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
        resources: {
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
  .command('reset [resources...]', 'Reset state of resources', (yargs) => {
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
        describe: 'HTTP method for evaluation (GET, PUT, POST, DELETE, ALL, OPTIONS)',
        type: 'string'
      })
      .positional('path', {
        describe: 'HTTP path for evaluation like /foo/bar',
        type: 'string'
      })
  }, (arvg) => {
    routeCommand(arvg)
  })
  .options({
    verbose: {
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false
    }
  })
  .argv

if (argv.verbose || process.env.DEBUG === 'true') console.log('CLI arguments:', argv)

// .command('connect [resourceId]', 'connect to platform managed resource', (yargs) => {
//   yargs.positional('resourceId', {
//     describe: 'ID of the resources you\'d like to directly connect to'
//   })
// }, (argv) => {
//   connectCommand(argv)
// })
