// import scrapeIt from 'scrape-it'
const scrapeIt = require(`scrape-it`)
const { debug } = require(`./util`)

const UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36`

class Runner {
  constructor(provider, db) {
    this.provider = provider
    this.db = db
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
    const { pages, schema, flatten } = this.provider
    const gen = pages()
    let url = gen.next().value
    for (;;) {
      debug(`fetching`, url)
      const items = flatten(
        await scrapeIt(
          {
            url,
            headers: { 'User-Agent': UA },
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
    debug(`source`, { name, url })
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
