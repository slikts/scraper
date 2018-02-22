import scrapeIt from '@slikts/scrape-it'
import fs from 'fs'
import knex from 'knex'
import { config, Config, RunnerOpts } from './Config'
import Item from './Item'
import Provider from './Provider'
import { error, log } from './util'

export interface FetchedItems {
  items: Item[]
  url: string
}

interface ScrapeResult {
  data: object
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
  body,
}: ScrapeResult): void =>
  // tslint:disable-next-line:no-console
  console.error(
    JSON.stringify(
      {
        body,
        fetchedUrls,
        headers,
        statusCode,
        statusMessage,
      },
      null,
      2
    )
  )

export interface Opts extends RunnerOpts {
  readonly provider: Provider
  readonly db: knex
}

export default class Runner {
  public opts: Opts
  constructor(opts: Opts) {
    this.opts = opts
  }

  public async run(): Promise<void> {
    await this.registerSource()
    for await (const { items, url } of this.fetchItems()) {
      if (this.opts.dryRun) {
        log('dry run, %d items skipped', items.length)
        break
      }
      const inserted = await this.save(items, url)
      if (!items.length || inserted < items.length) {
        log(`done`)
        break
      }
    }
  }

  public async *fetchItems(): AsyncIterableIterator<FetchedItems> {
    const { provider, provider: { schema } } = this.opts
    const gen = provider.pages()
    let pageOpts = gen.next().value
    for (;;) {
      log(`fetching %o`, pageOpts.url)
      const result = (await scrapeIt(
        {
          ...pageOpts,
          headers: {
            ...(pageOpts.headers || {}),
            'User-Agent': this.opts.userAgent,
          },
        },
        schema
      )) as ScrapeResult
      if (this.opts.debugItems) {
        log('items %o', result.data)
      }
      const items = provider.flatten(result)
      if (!items.length) {
        error('no items')
        logResultError(result)
        break
      }
      if (this.opts.debugItems) {
        log('items %o', items)
      }
      const next = gen.next(items)
      yield { items, url: pageOpts.url }
      if (next.done) {
        break
      }
      pageOpts = next.value
    }
  }

  public async registerSource(): Promise<void> {
    const { opts, opts: { db } } = this
    const { url, constructor: { name } } = opts.provider
    const exists = !!(await db(`source`).where(`name`, name)).length
    log(`source %o`, { name, url })
    if (!exists) {
      await db(`source`).insert({
        name,
        url,
      })
    }
  }

  public async save(items: Item[], url: string): Promise<number> {
    const tableName = `item`
    const keys = items.map(({ key }) => key)
    const { db } = this.opts
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
