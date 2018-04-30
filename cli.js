#!/usr/bin/env node
const cli = require('yargs')
const debug = (process.env.DEBUG === 'true')

const runCommand = require('./lib/commands/run')

cli.command('run [port]', 'run local dev server', (yargs) => {
  yargs.positional('port', {
    describe: 'port to bind local dev server',
    default: 4444
  })
}, runCommand((err) => {
  console.log('FINAL', err)
}))

const argv = cli.argv // no idea wtf reading `argv` props does to make it work
if (debug) console.log(argv)
