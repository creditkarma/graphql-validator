import * as fs from 'fs'
import * as glob from 'glob'
import { Document, GraphQLError, GraphQLSchema, parse, validate } from 'graphql'

export interface IQueryFileError {
  file: string
  errors: string[]
}

export interface ILoadQueryCallback {
  (err, docs?: Document[])
}

export interface IValidateCallback {
  (errors?: IQueryFileError[], results?)
}

export function validateQuery(schema: GraphQLSchema, document: Document): GraphQLError[] {
  return validate(schema, document)
}

export function loadQueryFiles(glob: string | string[], callback?: ILoadQueryCallback): Promise<Document[]> {
  return new Promise((resolve, reject) => {
    function loadAll(files) {
      const promises = files.map(readFile)
      return Promise.all(promises)
        .then((fileResults) => {
          const docs = fileResults.map((text: string, index) => parse(text))
          callback ? callback(null, docs) : resolve(docs)
        })
        .catch((err) => callback ? callback(err) : reject(err))
    }
    if (glob instanceof Array) {
      loadAll(glob)
    } else {
      readGlob(glob)
        .then(loadAll)
        .catch((err) => callback ? callback(err) : reject(err))
    }
  })
}

export function validateQueryFiles(glob: string, schema: GraphQLSchema,
                                   callback?: IValidateCallback): Promise<IQueryFileError[]> {
  return new Promise((resolve, reject) => {
    let queries
    readGlob(glob)
      .then((files) => {
        queries = files
        return loadQueryFiles(files)
      })
      .then((docs) => {
        const errors = validateQueries(docs, schema, queries)
        if (errors.length) {
          callback ? callback(errors) : reject(errors)
        } else {
          callback ? callback() : resolve()
        }
      })
      .catch((err) => {
        const errs = [{
          errors: [err.toString()],
          file: '',
        }]
        callback ? callback(errs) : reject(errs)
      })
  })
}

export function validateQueries(docs: Document[], schema: GraphQLSchema, files?: string[]): IQueryFileError[] {
  let results = []

  docs.forEach((doc, index) => {
    const errs = validateQuery(schema, doc)

    if (errs.length) {
      results.push({
        errors: errs.map((err) => err.toString()),
        file: files ? files[index] : '',
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
