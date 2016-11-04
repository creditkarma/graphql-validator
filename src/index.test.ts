import { expect } from 'chai'
import * as glob from 'glob'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as mkdirp from 'mkdirp'
import * as graphql from 'graphql'
import { loadSchema } from '@creditkarma/graphql-loader'
import * as validator from './index'

describe('GraphQL Validator', () => {
  let schema: graphql.GraphQLSchema
  before(() => {
    return loadSchema('./fixtures/schema/**/*.graphql')
      .then(r => schema = r)
  })

  describe('when validating a valid query', () => {
    let results
    before(() => {
      const query = graphql.parse(`{allPeople{name}}`)
      results = validator.validateQuery(schema, query)
    })

    it('expect results to be an empty array', () => {
      expect(results).to.exist
      expect(results.length).to.equal(0)
    })
  })

  describe('when validating a invalid query', () => {
    let results
    before(() => {
      const query = graphql.parse(`{allPeople{anInvalidFieldName}}`)
      results = validator.validateQuery(schema, query)
    })

    it('expect errors to exist', () => {
      expect(results.length).to.equal(1)
      expect(results[0].message).to.contain('anInvalidFieldName')
    })
  })

  describe('#loadQueryFiles', () => {
    describe('when loading a query glob', () => {
      const glob = './fixtures/queries/{allFilms,allPeople}.graphql'
      let results
      let cbResults
      before((done) => {
        return validator.loadQueryFiles(glob).then(r => {
          results = r
          validator.loadQueryFiles(glob, (err, cbr) => {
            cbResults = cbr
            done()
          })
        })
      })

      it('expect results to be two', () => {
        expect(results.length).to.equal(2)
      })
      it('expect callback results to be two', () => {
        expect(cbResults.length).to.equal(2)
      })
    })

    describe('when passing an invalid glob', () => {
      const glob = './fixtures/queries/{allFilms,allPeople}.test'
      let results
      let cbResults
      before((done) => {
        validator.loadQueryFiles(glob).then((r) => {
          results = r
          validator.loadQueryFiles(glob, (err, cbr) => {
            cbResults = cbr
            done()
          })
        })
      })

      it('expect results to empty', () => {
        expect(results.length).to.exist
      })
      it('expect callback results to empty', () => {
        expect(cbResults.length).to.exist
      })
    })

    describe('when accessing inaccessable path in glob', () => {
      const root = './fixtures/test'
      const glob = `${root}/*.graphql`
      let results
      let cbResults
      before((done) => {
        mkdirp(root, '333', () => {
          validator.loadQueryFiles(glob).catch((r) => {
            results = r
            validator.loadQueryFiles(glob, (cbr) => {
              cbResults = cbr
              rimraf(root, done)
            })
          })
        })
      })

      it('expect error to exist', () => {
        expect(results).to.exist
      })
      it('expect callback error to exist', () => {
        expect(cbResults).to.exist
      })
    })

    describe('when accessing unreadable file in glob', () => {
      const root = './fixtures/queries/unreadable'
      const glob = `${root}/*.graphql`
      let results
      let cbResults
      before((done) => {
        mkdirp(root, () => {
          fs.writeFile(`${root}/operation.graphql`, 'hello', {mode: 333}, (err) => {
            validator.loadQueryFiles(glob).catch((r) => {
              results = r
              validator.loadQueryFiles(glob, (cbr) => {
                cbResults = cbr
                rimraf(root, done)
              })
            })
          })
        })
      })

      it('expect error to exist', () => {
        expect(results).to.exist
      })
      it('expect callback error to exist', () => {
        expect(cbResults).to.exist
      })
    })

    describe('when loading a query file array', () => {
      let results
      let fileNames
      let cbResults
      before((done) => {
        glob('./fixtures/queries/*.graphql', (_, files) => {
          fileNames = files
          results = validator.loadQueryFiles(files).then(r => {
            results = r
            validator.loadQueryFiles(files, (err, cbr) => {
              cbResults = cbr
              done()
            })
          })
        })
      })

      it('should load one query per file', () => {
        expect(results.length).to.equal(fileNames.length)
      })
      it('should load one query per file by callback', () => {
        expect(cbResults.length).to.equal(fileNames.length)
      })
    })
  })

  describe('#validateQueryFiles', () => {
    describe('when validating a query array', () => {
      let results
      before(() => {
        return validator.loadQueryFiles('./fixtures/queries/*.graphql').then(queries => {
          results = validator.validateQueries(queries, schema)
        })
      })

      it('expect results to be emtpy', () => {
        expect(results.length).to.equal(0)
      })
    })

    describe('when validating a query glob', () => {
      let results
      before(() => {
        return validator.validateQueryFiles('./fixtures/queries/*.graphql', schema)
      })

      it('expect results to be empty', () => {
        expect(results).to.be.undefined
      })
    })

    describe('when validating a query glob with invalid queries', () => {
      let results
      before(() => {
        return validator.validateQueryFiles('./fixtures/queries/**/*.graphql', schema)
          .then(r => {results = r})
      })

      it('expect validation results to exist', () => {
        expect(results.length).to.equal(1)
      })
    })

    describe('when validating a glob with unreadable files', () => {
      const root = './fixtures/queries/unreadable'
      const glob = `${root}/*.graphql`
      let results
      let cbResults
      before((done) => {
        mkdirp(root, () => {
          fs.writeFile(`${root}/operation.graphql`, 'hello', {mode: '333'}, (err) => {
            validator.validateQueryFiles(glob, schema).catch((r) => {
              results = r
              validator.validateQueryFiles(glob, schema, (cbr) => {
                cbResults = cbr
                rimraf(root, done)
              })
            })
          })
        })
      })

      it('expect error to exist', () => {
        expect(results).to.exist
      })
      it('expect callback error to exist', () => {
        expect(cbResults).to.exist
      })
    })

  })
})
