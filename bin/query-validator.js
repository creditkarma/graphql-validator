#!/usr/bin/env node

/*
This is the CLI tool to validate scripts against a schema.  It uses the API found
in the src/ directory to validate all the files in the file glob CLI parameter.
 */

'use strict'

const program = require('commander')
const packagejson = require('../package.json')
const cli = require('../dist/cli')

program
  .version(packagejson.version)
  .usage(`[options] (<glob.graphql>)`)
  .option('-s, --schema [pattern]', 'Use a file glob that defines a complete schema to validate against', '')
  .parse(process.argv)

if (!program.args.length || !program.schema) {
  program.outputHelp()
} else {
  cli.loadSchema(program.schema)
    .then((schema) => cli.validateQueries(program.args[0], schema))
    .catch((err) => process.exit(1))
}
