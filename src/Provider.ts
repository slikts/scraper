import { ScrapeOptions } from '@slikts/scrape-it'
import { config } from './Config'
import Item from './Item'

export interface Page {
  url: string
  headers?: { [key: string]: string }
}

export interface ProviderConfig<T> {
  [name: string]: ProviderData
}

export interface ProviderGroups<T, K> {
  feed: T
  scrape: K
}

export interface ProviderData {
  base: string
  maxPages?: number
}

export interface ProviderOpts {
  readonly url: string
  readonly base: string
  readonly maxPages: number
}

export interface Provider extends ProviderOpts {
  flatten(a: { data: object }): Item[]
  pages(): IterableIterator<Page>
}

// tslint:disable-next-line:no-empty-interface
export interface FeedProvider extends Provider {}

export interface ScrapeProvider extends Provider {
  readonly schema: ScrapeOptions
}

export interface ProviderConstructor<T extends Provider> {
  new (a?: ProviderData): T
}

export abstract class FeedProvider {}

export type ProviderConfigGroups = ProviderGroups<
  ProviderConfig<FeedProvider>,
  ProviderConfig<ScrapeProvider>
>

const providerName = (name: string): string => `${__dirname}/providers/${name}`

export type ProviderConstructorDataPair<T extends Provider> = [
  ProviderConstructor<T>,
  ProviderData
]

export type ProviderConstructors = ProviderGroups<
  Array<ProviderConstructorDataPair<FeedProvider>>,
  Array<ProviderConstructorDataPair<ScrapeProvider>>
>

const parseProviderConfigGroups = async ({
  feed,
  scrape,
}: ProviderConfigGroups): Promise<ProviderConstructors> => ({
  feed: await parseProviderConfig(feed),
  scrape: await parseProviderConfig(scrape),
})

const importConstructor = async (name: string): Promise<any> =>
  (await import(providerName(name))).default

type ProviderNameDataPair = [string, ProviderData]
type ProviderDataPair<T extends Provider> = [
  ProviderConstructor<T>,
  ProviderData
]

const parseProviderNameDataPair = async ([
  name,
  data,
]: ProviderNameDataPair): Promise<[any, ProviderData]> => [
  await importConstructor(name),
  data,
]

const parseProviderConfig = async <T extends Provider>(
  providerConfig: ProviderConfig<T>
): Promise<Array<ProviderConstructorDataPair<T>>> =>
  Promise.all(Object.entries(providerConfig).map(parseProviderNameDataPair))

export const getProviderConstructors = async (): Promise<
  ProviderConstructors
> => parseProviderConfigGroups(config.providers)
