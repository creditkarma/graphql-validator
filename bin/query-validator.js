#!/usr/bin/env node

/*
This is the CLI tool to validate scripts against a schema.  It uses the API found
in the src/ directory to validate all the files in the file glob CLI parameter.
 */

'use strict'

const program = require('commander')
const packagejson = require('../package.json')
const loader = require('graphql-schema-loader')
const validator = require('../dist/index')

program
  .version(packagejson.version)
  .usage(`[options] (<glob.graphql>)`)
  .option('-s, --schema [pattern]', 'Use a file glob that defines a complete schema to validate against', '')
  .parse(process.argv)

if (!program.args.length || !program.schema) {
  program.outputHelp()
} else {
  loadSchema()
    .then(validateQueries)
    .catch(() => process.exit(1))
}

function loadSchema() {
  return new Promise((resolve, reject) => {
    console.log(`\nLoading schema from ${program.schema}`)
    loader.loadSchema(program.schema)
    .then((schema) => {
      console.log('valid schema loaded...')
      resolve(schema)
    })
    .catch((errs) => {
      console.log(`${errs.toString()}\n`)
      reject(errs)
    })
  })
}

function validateQueries(schema) {
  return new Promise((resolve, reject) => {
    const globArg = program.args[0]
    console.log(`\nValidating queries for ${globArg} using loaded schema`)

    validator.validateQueryFiles(globArg, schema).then(() => {
      console.log('All queries are valid\n')
      resolve()
    }).catch((errs) => {
      console.log('\nErrors found:')
      errs.forEach((err) => {
        console.log(`\nFile: ${err.file}`)
        err.errors.forEach((errStr) => {
          console.log(`\t${errStr}`)
        })
      })
      console.log('\n')
      reject(errs)
    })
  })
}
