const scrapeIt = require(`scrape-it`)
const { debug, config } = require(`./util`)

class Runner {
  constructor(provider, db, userAgent = config.scraper.userAgent) {
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
    let url = gen.next().value
    for (;;) {
      debug(`fetching %s`, url)
      const items = provider.flatten(
        await scrapeIt(
          {
            url,
            headers: { 'User-Agent': this.userAgent },
          },
          schema
        )
      )
      const next = gen.next(items)
      yield { items, url }
      if (next.done) {
        break
      }
      url = next.value
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

  async save(items, url) {
    const tableName = `item`
    const keys = items.map(({ key }) => key)
    const { db } = this
    const existing = (await db
      .select(`key`)
      .from(tableName)
      .whereIn(`key`, keys)).map(({ key }) => key)
    const result = await db.batchInsert(
      tableName,
      items.filter(({ key }) => !existing.includes(key))
    )
    const inserted = result.length ? result[0].rowCount : 0
    debug(`${inserted}/${items.length} items inserted from ${url}`)
    return inserted
  }
}

module.exports = Runner
