import { config } from './Config'
import { ProviderConstructor } from './Provider'
import Runner from './Runner'
import {
  error,
  getDb,
  getProviderConstructors,
  log,
  ProviderConstructorData,
} from './util'

log(`config %o`, config)

const main = async (db = getDb()) => {
  const { constructors, providerConfig } = await getProviderConstructors()
  for (const Provider of constructors) {
    try {
      await new Runner({
        db,
        provider: new Provider(providerConfig[Provider.name]),
        ...config.runner,
      }).run()
    } catch (err) {
      error('provider error', err)
    }
  }
  log(`all providers done`)
  // XXX why is this necessary
  process.exit()
}
if (require.main === module) {
  main()
}
