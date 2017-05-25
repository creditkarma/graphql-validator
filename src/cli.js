'use strict'

const loader = require('@creditkarma/graphql-loader')
const validator = require('./index')

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
exports.loadSchema = loadSchema

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
exports.validateQueries = validateQueries
