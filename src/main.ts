import Runner from './Runner'
import { debug, getDb, getProviderConstructors } from './util'
// import { ProviderConstructor } from './Provider'

const main = async (db = getDb(), constructors = getProviderConstructors()) => {
  for (const Provider of constructors) {
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
