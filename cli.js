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
  .version('version', version).alias('version', 'V')
  .command('run [componentNames...]', 'Run local dev server', (yargs) => {
    yargs
      .positional('componentNames', {
        describe: 'Names of components to run',
        type: 'string'
      })
      .options({
        port: {
          alias: 'p',
          type: 'number',
          description: 'Port bind local dev server',
          default: 1234
        },
        autoReload: {
          alias: 'a',
          type: 'boolean',
          description: 'Enable auto-reload for dev server'
        },
        env: {
          alias: 'e',
          type: 'array',
          description: 'Runtime environment variables override'
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
  .command('inspect [inspectTypes...]', 'Inspect noop app', (yargs) => {
    yargs
      .positional('inspectTypes', {
        describe: 'Type to inspect (noopfiles, components, resources, routes)',
        type: 'array'
      })
  }, (argv) => {
    inspectCommand(argv)
  })
  .command('reset [resourceNames...]', 'Reset resource state', (yargs) => {
    yargs
      .positional('resourceNames', {
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
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }
  })
  .argv

if (!argv._.length) console.log(`noop-local v${version}`)
if (argv.verbose || process.env.DEBUG === 'true') console.log(argv)

// cli.command('connect [resourceId]', 'connect to platform managed resource', (yargs) => {
//   yargs.positional('resourceId', {
//     describe: 'ID of the resources you\'d like to directly connect to'
//   })
// }, connectCommand)
