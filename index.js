const Runner = require(`./src/Runner`)
const { debug, getDb, getProviders } = require(`./src/util`)

const main = async (db = getDb(), providers = getProviders()) => {
  for (const provider of providers) {
    try {
      await new Runner(provider, db).run()
    } catch (err) {
      debug(`error`, err)
    }
  }
  debug(`all providers done`)
}
if (require.main === module) {
  main()
}
