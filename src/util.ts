/* eslint-disable no-underscore-dangle */

import toml from 'toml'
import knex from 'knex'
import fs from 'fs'
import FormData from 'form-data'

export const debug = require(`debug`)(require(`../package.json`).name)
export const config = toml.parse(fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`))

debug(`config %o`, config)
export const getDb = (url = config.db.url) =>
  knex({
    client: `pg`,
    connection: url,
  })

export const getProviders = (providers: string[] = config.scraper.providers) =>
  // eslint-disable-next-line import/no-dynamic-require, global-require
  providers.map(provider => require(`${__dirname}/providers/${provider}`))

export const parseEp = (a: string): number => +(a.trim().match(/\d+(?:\.\d+)?$/) || [])[0]

export const range = function*(a: number, b: number): IterableIterator<number> {
  for (let i = a; i <= b; i += 1) {
    yield i
  }
}

export const buildFormBody = (formData: FormData, fields: {[key: string]: string | number}) =>
  Object.entries(fields)
    .map(([field, value]) => [formData._multiPartHeader(field, value, {}), value].join(``))
    .concat(``)
    .join(FormData.LINE_BREAK) + formData._lastBoundary()
