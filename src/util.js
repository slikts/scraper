/* eslint-disable no-underscore-dangle */

const toml = require(`toml`)
const knex = require(`knex`)
const fs = require(`fs`)
const FormData = require(`form-data`)

const debug = require(`debug`)(require(`../package.json`).name)
const config = toml.parse(fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`))

debug(`config %o`, config)
const getDb = (url = config.db.url) =>
  knex({
    client: `pg`,
    connection: url,
  })

const getProviders = (providers = config.scraper.providers) =>
  // eslint-disable-next-line import/no-dynamic-require, global-require
  providers.map(provider => require(`${__dirname}/../providers/${provider}`))

const parseEp = a => +a.trim().match(/\d+(?:\.\d+)?$/)[0]

const range = function*(a, b) {
  for (let i = a; i <= b; i += 1) {
    yield i
  }
}

const buildFormBody = (formData, fields) =>
  Object.entries(fields)
    .map(([field, value]) => [formData._multiPartHeader(field, value, {}), value].join(``))
    .concat(``)
    .join(FormData.LINE_BREAK) + formData._lastBoundary()

module.exports = {
  debug,
  getDb,
  getProviders,
  config,
  parseEp,
  range,
  buildFormBody,
}
