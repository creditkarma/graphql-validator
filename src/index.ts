import * as fs from 'fs'
import { Document, GraphQLSchema, GraphQLError, validate , parse } from 'graphql'
import * as glob from 'glob'

export interface IQueryFileError {
  file: string
  errors: string[]
}

export interface ILoadQueryCallback {
  (err, docs?: Document[])
}

export interface IValidateCallback {
  (err, errors?: IQueryFileError[])
}

export function validateQuery(schema: GraphQLSchema, document: Document): GraphQLError[] {
  return validate(schema, document)
}

export function loadQueryFiles(glob: string | string[], callback?: ILoadQueryCallback): Promise<Document[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const files = glob instanceof Array ? glob : await readGlob(glob)
      const promises = files.map(readFile)
      Promise.all(promises).then((fileResults) => {
        const docs = fileResults.map((text, index) => parse(text))
        callback ? callback(null, docs) : resolve(docs)
      }).catch((err) => {
        callback ? callback(err) : reject(err)
      })
    } catch (err) {
      callback ? callback(err) : reject(err)
    }
  })
}

export function validateQueryFiles(glob: string, schema: GraphQLSchema,
                                   callback?: IValidateCallback): Promise<IQueryFileError[]> {
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

export function validateQueries(docs: Document[], schema: GraphQLSchema, files?: string[]): IQueryFileError[] {
  let results = []

  docs.forEach((doc, index) => {
    const errs = validateQuery(schema, doc)

    if (errs.length) {
      results.push({
        errors: errs.map(err => err.toString()),
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
