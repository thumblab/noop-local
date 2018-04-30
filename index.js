const parser = require('docker-file-parser')
const examples = []

examples.push('FROM ubuntu:latest\n' +
  'ADD /foo\n' +
  'RUN node index.js'
)

examples.push('COMPONENT bort function\n' +
  'FROM ubuntu:latest\n' +
  'ADD /foo\n' +
  'RUN node index.js'
)

examples.forEach((example) => {
  console.log(parser.parse(example))
})
