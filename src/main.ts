import Runner from "./Runner"
import { ProviderConstructor } from "./Provider"
import { debug, getDb, getProviderConstructors } from "./util"

const main = async (db = getDb(), constructors?: ProviderConstructor[]) => {
  if (!constructors) {
    constructors = await getProviderConstructors()
  }
  for (const Provider of constructors) {
    try {
      await new Runner(new Provider(), db).run()
    } catch (err) {
      debug(`error`, err)
    }
  }
  debug(`all providers done`)
  // XXX
  process.exit()
}
if (require.main === module) {
  main()
}
