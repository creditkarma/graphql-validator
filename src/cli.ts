import * as loader from '@creditkarma/graphql-loader'
import * as validator from './index'

export function loadSchema(schemaPattern: string): Promise<loader.GraphQLSchema> {
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

export function validateQueries(queriesPattern: string, validSchema: loader.GraphQLSchema): Promise<void> {
  return new Promise<void>((resolve, reject) => {
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

    validator.validateQueryFiles(queriesPattern, validSchema).then(() => {
      console.log('All queries are valid\n')
      resolve()
    }).catch((errs) => {
      outputErrors(errs)
      reject(errs)
    })
  })
}
