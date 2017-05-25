#!/usr/bin/env node

/*
This is the CLI tool to validate scripts against a schema.  It uses the API found
in the src/ directory to validate all the files in the file glob CLI parameter.
 */

'use strict'

const program = require('commander')
const packagejson = require('../package.json')
const loader = require('@creditkarma/graphql-loader')
const validator = require('../dist/index')

program
  .version(packagejson.version)
  .usage(`[options] (<glob.graphql>)`)
  .option('-s, --schema [pattern]', 'Use a file glob that defines a complete schema to validate against', '')
  .parse(process.argv)

if (!program.args.length || !program.schema) {
  program.outputHelp()
} else {
  loadSchema(program.schema)
    .then((schema) => validateQueries(program.args[0], schema))
    .catch((err) => process.exit(1))
}

function loadSchema(schemaPattern) {
  return new Promise((resolve, reject) => {
    console.log(`\nLoading schema from ${schemaPattern}`)
    loader.loadSchema(schemaPattern)
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

function validateQueries(queriesPattern, validSchema) {
  return new Promise((resolve, reject) => {
    console.log(`\nValidating queries for ${queriesPattern} using loaded schema`)

    function outputErrors(errs) {
      console.log('\nErrors found:')
      errs.forEach((err) => {
        console.log(`\nFile: ${err.file}`)
        err.errors.forEach((errStr) => {
          console.log(`\t${errStr}`)
        })
      })
      console.log('\n')
    }

    validator.validateQueryFiles(queriesPattern, validSchema).then((errs) => {
      if (!errs) {
        console.log('All queries are valid\n')
        resolve()
      } else {
        outputErrors(errs)
        reject(errs)
      }
    }).catch((errs) => {
      outputErrors(errs)
      reject(errs)
    })
  })
}
