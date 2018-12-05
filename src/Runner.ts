import scrapeIt from '@slikts/scrape-it'
import fs from 'fs'
import knex from 'knex'
import { config, Config, RunnerConfig } from './Config'
import Item from './Item'
import { Page, Provider } from './Provider'
import { error, log } from './util'

export interface Opts extends RunnerConfig {
  readonly provider: Provider
  readonly db: knex
  readonly fetch: ItemFetcher
}

export type ItemFetcher = (url: Page, opts: Opts) => AsyncIterator<FetchResult>

export type FetchResult = object

export default abstract class Runner {
  constructor(readonly opts: Opts) {
    this.opts = opts
  }

  async run(): Promise<void> {
    const { opts } = this
    await this.registerSource()
    for await (const { items, url } of this.fetchItems(opts.fetch)) {
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

  async registerSource(): Promise<void> {
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

  async *fetchItems(fetch: ItemFetcher): AsyncIterableIterator<FetchResult> {
    const { opts, opts: { provider } } = this
    const gen = provider.pages()
    let pageOpts = gen.next().value
    for (;;) {
      log(`fetching %o`, pageOpts.url)
      const result = await fetch(pageOpts, this.opts)
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
}
