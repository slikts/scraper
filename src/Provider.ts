import { ScrapeOptions } from '@slikts/scrape-it'
import Item from './Item'

export interface Page {
  url: string
  headers?: { [key: string]: string }
}

export interface ProviderConfig {
  [name: string]: ProviderData
}

export interface ProviderData {
  base: string
  maxPages?: number
}

export default interface Provider {
  readonly url: string
  readonly base: string
  readonly schema: ScrapeOptions
  readonly maxPages: number
  flatten(a: { data: object }): Item[]
  pages(): IterableIterator<Page>
}

export interface ProviderConstructor {
  new (a?: ProviderData): Provider
}
