const Reader = require(`./providers/Reader`)
const Runner = require(`./src/Runner`)
const { debug } = require(`./src/util`)
const { getDb } = require(`./src/util`)

const main = async (db = getDb()) => {
  await new Runner(Reader, db).run()
  debug(`finished running`)
}
if (require.main === module) {
  main()
}
