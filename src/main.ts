import Runner from './Runner'
import { ProviderConstructor } from './Provider'
import {
  log,
  getDb,
  getProviderConstructors,
  ProviderConstructorData,
} from './util'
import { config } from './Config'

log(`config %o`, config)

const main = async (db = getDb()) => {
  const { constructors, providerConfig } = await getProviderConstructors()
  for (const Provider of constructors) {
    await new Runner({
      provider: new Provider(providerConfig[Provider.name]),
      db,
      ...config.runner,
    }).run()
  }
  log(`all providers done`)
  // XXX why is this necessary
  process.exit()
}
if (require.main === module) {
  main()
}
