const knex = require(`knex`)
const Reader = require(`./providers/Reader`)
const Runner = require(`./src/Runner`)
const { debug } = require(`./src/util`)

const pg = knex({
  client: `pg`,
  // connection: process.env.PG_CONNECTION_STRING,
  connection: `postgres://scraper:123@localhost/scraper`,
})

const main = async db => {
  const result = await new Runner(Reader, db).run()
  // const result = await db.select().table(`item`)
  // debug(result)
  // debug(`result %o`, result)
}
main(pg)
// ;(async () => {
//   debug(await pg.select().table(`item`))
// })()
