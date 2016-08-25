import * as fs from 'fs'
import * as graphql from 'graphql'
import * as glob from 'glob'


export interface QueryFileError {
  file: string
  errors: string[]
}

export interface LoadQueryCallback {
  (err, docs?: graphql.Document[])
}

export interface ValidateCallback {
  (err, errors?: QueryFileError[])
}

export function validateQuery(schema: graphql.GraphQLSchema, document: graphql.Document): graphql.GraphQLError[] {
  return graphql.validate(schema, document)
}

export function loadQueryFiles(glob: string | string[], callback?: LoadQueryCallback): Promise<graphql.Document[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const files = glob instanceof Array ? glob : await readGlob(glob)
      const promises = files.map(readFile)
      Promise.all(promises).then((fileResults) => {
        const docs = fileResults.map((text, index) => graphql.parse(text))
        callback ? callback(null, docs) : resolve(docs)
      }).catch((err) => {
        callback ? callback(err) : reject(err)
      })
    } catch (err) {
      callback ? callback(err) : reject(err)
    }
  })
}

export function validateQueryFiles(glob: string, schema: graphql.GraphQLSchema, callback?: ValidateCallback): Promise<QueryFileError[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const files = await readGlob(glob)
      const docs = await loadQueryFiles(files)
      const errors = validateQueries(docs, schema, files)
      callback ? callback(null, errors) : resolve(errors)
    } catch (err) {
      callback ? callback(err) : reject(err)
    }
  })
}

export function validateQueries(docs: graphql.Document[], schema: graphql.GraphQLSchema,  files?: string[]): QueryFileError[] {
  let results = []

  docs.forEach((doc, index) => {
    const errs = validateQuery(schema, doc)

    if (errs.length) {
      results.push({
        file: files ? files[index] : '',
        errors: errs.map(err => err.toString()),
      })
    }
  })

  return results
}

function readGlob(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, {silent: true}, (err, files) => err ? reject(err) : resolve(files))
  })
}

function readFile(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => err ? reject(err) : resolve(data))
  })
}
