#!/usr/bin/env node

const runCommand = require('./lib/commands/run')
const inspectCommand = require('./lib/commands/inspect')
const resetCommand = require('./lib/commands/reset')
const routeCommand = require('./lib/commands/route')
// const connectCommand = require('./lib/commands/connect')

const yargs = require('yargs')
  .usage('$0 <command> [options]')
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
          description: 'Disable auto-reload for dev server'
        },
        env: {
          alias: 'e',
          type: 'array',
          description: 'Runtime environment variable(s)'
        },
        'env-file': {
          alias: 'f',
          type: 'array',
          description: 'Specify paths to environment variable file(s)'
        },
        component: {
          alias: 'c',
          type: 'array',
          description: 'Name of component(s) to run'
        },
        resource: {
          alias: 'r',
          type: 'array',
          description: 'Name of resource(s) to run'
        },
        'router-logging': {
          alias: 'l',
          type: 'boolean',
          describe: 'Output global router logs'
        },
      })
  }, (argv) => {
    runCommand(argv)
  })
  .command('inspect [type..]', 'Inspect Noop app', (yargs) => {
    yargs
      .positional('type', {
        describe: 'Type(s) to inspect (noopfiles, components, resources, routes)'
      })
  }, (argv) => {
    inspectCommand(argv)
  })
  .command('reset [resource]', 'Reset state of resource', (yargs) => {
    yargs
      .positional('resource', {
        describe: 'Name of resource(s) to reset'
      })
      .demandOption(['resource'], 'Provide \'resource\' argument when using the reset command')
  }, (argv) => {
    resetCommand(argv)
  })
  .command('route [path] [method]', 'Evaluate routing of a specific request', (yargs) => {
    yargs
      .positional('path', {
        describe: 'HTTP path for evaluation like /foo/bar',
        type: 'string'
      })
      .positional('method', {
        describe: 'HTTP method for evaluation (GET, PUT, POST, DELETE, OPTIONS)',
        type: 'string',
        default: 'GET'
      })
      .demandOption(['path'], 'Provide both \'path\' and \'method\' arguments when using the route command')
  }, (argv) => {
    routeCommand(argv)
  })
  .options({
    'root-path': {
      type: 'string',
      description: 'Specify root path of app, overrides default usage of git root',
      alias: 'R'
    },
    verbose: {
      type: 'boolean',
      description: 'Run with verbose logging'
    }
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .strictOptions()

const commands = yargs.getCommandInstance().getCommands()
const argv = yargs.argv

if (!commands.includes(argv._[0])) {
  yargs.showHelp()
  console.log(`\nUnknown command: ${argv._[0]}`)
}

if (argv.verbose || process.env.DEBUG === 'true') console.log('CLI arguments:', argv)

// .command('connect [resourceId]', 'connect to platform managed resource', (yargs) => {
//   yargs.positional('resourceId', {
//     describe: 'ID of the resources you\'d like to directly connect to'
//   })
// }, (argv) => {
//   connectCommand(argv)
// })
