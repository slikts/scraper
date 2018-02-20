import scrapeIt from '@slikts/scrape-it'
import { debug, config } from './util'
import Provider from './Provider'
import knex from 'knex'
import Item from './Item'


export default class Runner {
  constructor(readonly provider: Provider, readonly db: knex, readonly userAgent = config.scraper.userAgent) {
    this.provider = provider
    this.db = db
    this.userAgent = userAgent
  }

  async run() {
    await this.registerSource()
    for await (const { items, url } of this.fetchItems()) {
      const inserted = await this.save(items, url)
      if (!inserted) {
        debug(`done`)
        break
      }
    }
  }

  async *fetchItems() {
    const { provider, provider: { schema } } = this
    const gen = provider.pages()
    let pageOpts = gen.next().value
    for (;;) {
      debug(`fetching %o`, pageOpts.url)
      const items = provider.flatten(
        <{ data: Object }> await scrapeIt(
          {
            ...pageOpts,
            headers: {
              ...(pageOpts.headers || {}),
              'User-Agent': this.userAgent,
            },
          },
          schema
        )
      )
      const next = gen.next(items)
      yield { items, url: pageOpts.url }
      if (next.done) {
        break
      }
      pageOpts = next.value
    }
  }

  async registerSource() {
    const { db } = this
    const { name, url } = this.provider
    const exists = !!(await db(`source`).where(`name`, name)).length
    debug(`source %o`, { name, url })
    if (!exists) {
      await db(`source`).insert({
        name,
        url,
      })
    }
  }

  async save(items: Item[], url: string) {
    const tableName = `item`
    const keys = items.map(({ key }) => key)
    const { db } = this
    const existing = (await db
      .select(`key`)
      .from(tableName)
      .whereIn(`key`, keys)).map(({ key }: { key: string }) => key)
    const result = await db.batchInsert(
      tableName,
      items.filter(({ key }) => !existing.includes(key))
    )
    const inserted = result.length ? result[0].rowCount : 0
    debug(`${inserted}/${items.length} items inserted from ${url}`)
    return inserted
  }
}
