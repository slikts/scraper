import Runner from "./Runner"
import { ProviderConstructor } from "./Provider"
import {
  log,
  getDb,
  getProviderConstructors,
  ProviderConstructorData,
  config
} from "./util"

const main = async (db = getDb(), data?: ProviderConstructorData) => {
  const { constructors, providerConfig } =
    data || (await getProviderConstructors())
  for (const Provider of constructors) {
    await new Runner(
      new Provider(providerConfig[Provider.name]),
      db,
      config.scraper.dryRun
    ).run()
  }
  log(`all providers done`)
  // XXX why is this necessary
  process.exit()
}
if (require.main === module) {
  main()
}
