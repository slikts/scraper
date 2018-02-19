const Runner = require(`./src/Runner`)
const { debug, config, getDb } = require(`./src/util`)

const main = async (db = getDb()) => {
  for (const provider of config.scraper.providers) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    await new Runner(require(`./providers/${provider}`), db).run()
  }
  debug(`finished running`)
}
if (require.main === module) {
  main()
}
