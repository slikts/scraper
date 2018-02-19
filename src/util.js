const toml = require(`toml`)
const knex = require(`knex`)
const fs = require(`fs`)

const debug = require(`debug`)(require(`../package.json`).name)
const config = toml.parse(fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`))

debug(`config %o`, config)
const getDb = (url = config.db.url) =>
  knex({
    client: `pg`,
    connection: url,
  })

module.exports = {
  debug,
  getDb,
}
