import Runner from './src/Runner'
import { debug, getDb, getProviders } from './src/util'

const main = async (db = getDb(), providers = getProviders()) => {
  for (const Provider of providers) {
    try {
      await new Runner(new Provider(), db).run()
    } catch (err) {
      debug(`error`, err)
    }
  }
  debug(`all providers done`)
}
if (require.main === module) {
  main()
}
