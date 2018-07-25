#!/usr/bin/env node
const cli = require('yargs')
const debug = (process.env.DEBUG === 'true')
const version = require('./package.json').version

const runCommand = require('./lib/commands/run')
const inspectCommand = require('./lib/commands/inspect')

console.log(`Noop CLI v${version}`)

cli.command('run [port]', 'run local dev server', (yargs) => {
  yargs.positional('port', {
    describe: 'port to bind local dev server',
    default: 4444
  })
}, runCommand)

cli.command('inspect', 'inspect noop app', inspectCommand)

const argv = cli.argv // no idea wtf reading `argv` props does to make it work
if (debug) console.log(argv)
