import Runner from "./Runner"
import { ProviderConstructor } from "./Provider"
import {
  log,
  getDb,
  getProviderConstructors,
  ProviderConstructorData
} from "./util"

const main = async (db = getDb(), data?: ProviderConstructorData) => {
  const { constructors, config } = data || (await getProviderConstructors())
  for (const Provider of constructors) {
    await new Runner(new Provider(config[Provider.name]), db).run()
  }
  log(`all providers done`)
  // XXX why is this necessary
  process.exit()
}
if (require.main === module) {
  main()
}
