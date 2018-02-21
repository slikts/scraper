import scrapeIt from "@slikts/scrape-it"
import { log, error, config } from "./util"
import Provider from "./Provider"
import knex from "knex"
import Item from "./Item"
import fs from "fs"

export interface FetchedItems {
  items: Item[]
  url: string
}

interface ScrapeResult {
  data: Object
  response: {
    headers: { [key: string]: string }
    statusCode: number
    statusMessage: string
    fetchedUrls: string[]
  }
  body: string
}

const logResultError = ({
  response: { headers, statusCode, statusMessage, fetchedUrls },
  body
}: ScrapeResult): void =>
  console.error(
    JSON.stringify(
      {
        fetchedUrls,
        headers,
        statusCode,
        statusMessage,
        body
      },
      null,
      2
    )
  )

export default class Runner {
  constructor(
    readonly provider: Provider,
    readonly db: knex,
    readonly dryRun = false,
    readonly userAgent = config.scraper.userAgent
  ) {
    this.provider = provider
    this.db = db
    this.userAgent = userAgent
    this.dryRun = dryRun
  }

  async run(): Promise<void> {
    await this.registerSource()
    for await (const { items, url } of this.fetchItems()) {
      if (this.dryRun) {
        log("dry run, %d items skipped", items.length)
        break
      }
      const inserted = await this.save(items, url)
      if (!items.length || inserted < items.length) {
        log(`done`)
        break
      }
    }
  }

  async *fetchItems(): AsyncIterableIterator<FetchedItems> {
    const { provider, provider: { schema } } = this
    const gen = provider.pages()
    let pageOpts = gen.next().value
    for (;;) {
      log(`fetching %o`, pageOpts.url)
      const result = <ScrapeResult>await scrapeIt(
        {
          ...pageOpts,
          headers: {
            ...(pageOpts.headers || {}),
            "User-Agent": this.userAgent
          }
        },
        schema
      )
      const items = provider.flatten(result)
      if (!items.length) {
        error("no items")
        logResultError(result)
        break
      }
      const next = gen.next(items)
      yield { items, url: pageOpts.url }
      if (next.done) {
        break
      }
      pageOpts = next.value
    }
  }

  async registerSource(): Promise<void> {
    const { db } = this
    const { name, url } = this.provider
    const exists = !!(await db(`source`).where(`name`, name)).length
    log(`source %o`, { name, url })
    if (!exists) {
      await db(`source`).insert({
        name,
        url
      })
    }
  }

  async save(items: Item[], url: string): Promise<number> {
    const tableName = `item`
    const keys = items.map(({ key }) => key)
    const { db } = this
    const existing: string[] = (await db
      .select(`key`)
      .from(tableName)
      .whereIn(`key`, keys)).map(({ key }: { key: string }) => key)
    const result = await db.batchInsert(
      tableName,
      items.filter(({ key }) => !existing.includes(key))
    )
    const inserted: number = result.length ? result[0].rowCount : 0
    log(`${inserted}/${items.length} items inserted from ${url}`)
    return inserted
  }
}
