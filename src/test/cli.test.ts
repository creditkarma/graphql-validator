import {expect} from 'code'
import * as Lab from 'lab'
export const lab = Lab.script()

const describe = lab.describe
const it = lab.it
const before = lab.before

import { GraphQLLoaderError } from '@creditkarma/graphql-loader'
import * as fs from 'fs'
import * as graphql from 'graphql'
import * as mkdirp from 'mkdirp'
import * as rimraf from 'rimraf'
import * as cli from '../cli'

describe('GraphQL Validator CLI', () => {
  describe('#loadSchema', () => {
    describe('when loading a schema glob', () => {
      const glob = './fixtures/schema/**/*.graphql'
      let schema
      before((done) => {
        cli.loadSchema(glob).then((s) => {
          schema = s
          done()
        })
      })

      it('expect schema to be a graphql schema', (done) => {
        expect(schema).to.exist()
        expect(schema).to.be.an.instanceof(graphql.GraphQLSchema)
        done()
      })
    })

    describe(`when loading an invalid glob`, () => {
      const glob = './fixtures/not/an/existing/path'
      let err
      before((done) => {
        cli.loadSchema(glob).catch((e) => {
          err = e
          done()
        })
      })

      it('expect error to exist', (done) => {
        expect(err).to.exist()
        expect(err).to.be.an.instanceof(GraphQLLoaderError)
        done()
      })
    })
  })

  describe('#validateQueries', () => {
    let schema: graphql.GraphQLSchema
    before(() => cli.loadSchema('./fixtures/schema/**/*.graphql').then((r) => schema = r))

    describe('when validating a query glob', () => {
      let results
      let glob = './fixtures/queries/*.graphql'
      before((done) => {
        cli.validateQueries(glob, schema).then((r) => {
          results = r
          done()
        })
      })

      it('expect results to be empty', (done) => {
        expect(results).to.be.undefined()
        done()
      })
    })

    describe('when validating a query glob with invalid queries', () => {
      let errs
      let glob = './fixtures/queries/**/*.graphql'
      before((done) => {
        cli.validateQueries(glob, schema).catch((e) => {
          errs = e
          done()
        })
      })

      it('expect validation results to exist', (done) => {
        expect(errs).to.be.an.array()
        expect(errs.length).to.equal(1)
        done()
      })
    })

    describe('when validating a glob with unreadable files', () => {
      const root = './fixtures/queries/unreadable'
      const glob = `${root}/*.graphql`
      let errs
      before((done) => {
        mkdirp(root, () => {
          fs.writeFile(`${root}/operation.graphql`, 'hello', {mode: '333'}, (err) => {
            cli.validateQueries(glob, schema).catch((e) => {
              errs = e
              rimraf(root, done)
            })
          })
        })
      })

      it('expect error to exist', (done) => {
        expect(errs).to.exist()
        expect(errs.length).to.equal(1)
        done()
      })
    })
  })
})
