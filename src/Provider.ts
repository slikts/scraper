import Item from './Item'
import { ScrapeOptions } from 'scrape-it'

export interface Page {
  url: string
  headers?: {[key: string]: string}
}

export default interface Provider {
  readonly name: string
  readonly url: string
  readonly base: string
  readonly schema: ScrapeOptions
  readonly maxPages: number
  flatten(a: Object): Item[]
  pages(): IterableIterator<Page>
}
