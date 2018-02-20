/* eslint-disable no-underscore-dangle */

import toml from 'toml'
import knex from 'knex'
import fs from 'fs'
import FormData from 'form-data'
import { ProviderConstructor } from './Provider'
import makeDebug from 'debug'

export const debug = makeDebug(<string> require(`../package.json`).name)
export const config: Config = toml.parse(fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`))

export interface Config {
  db: {
    url: string
  }
  scraper: {
    providers: string[]
    userAgent: string
  }
}

debug(`config %o`, config)
export const getDb = (url = config.db.url): knex =>
  knex({
    client: `pg`,
    connection: url,
  })

export const getProviders = (providers: string[] = config.scraper.providers): ProviderConstructor[] =>
  // eslint-disable-next-line import/no-dynamic-require, global-require
  providers.map(provider => require(`${__dirname}/providers/${provider}`))

export const parseEp = (a: string): number => +(a.trim().match(/\d+(?:\.\d+)?$/) || [])[0]

export const range = function*(a: number, b: number): IterableIterator<number> {
  for (let i = a; i <= b; i += 1) {
    yield i
  }
}

export const buildFormBody = (formData: FormData, fields: {[key: string]: string | number}): string =>
  Object.entries(fields)
    // @ts-ignore
    .map(([field, value]) => [formData._multiPartHeader(field, value, {}), value].join(``))
    .concat(``)
    // @ts-ignore
    .join(FormData.LINE_BREAK) + formData._lastBoundary()
