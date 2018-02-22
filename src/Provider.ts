import { ScrapeOptions } from '@slikts/scrape-it'
import Item from './Item'

export interface IPage {
  url: string
  headers?: { [key: string]: string }
}

export interface IProviderConfig {
  [name: string]: IProviderData
}

export interface IProviderData {
  base: string
  maxPages?: number
}

export default interface IProvider {
  readonly url: string
  readonly base: string
  readonly schema: ScrapeOptions
  readonly maxPages: number
  flatten(a: { data: object }): Item[]
  pages(): IterableIterator<IPage>
}

export interface IProviderConstructor {
  new (a?: IProviderData): IProvider
}
