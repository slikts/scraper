/* eslint-disable no-underscore-dangle */

import knex from 'knex'
import FormData from 'form-data'
import makeDebug from 'debug'
import { ProviderConstructor, ProviderConfig, ProviderData } from './Provider'
import { config } from './Config'

const { name: packageName }: { name: string } = require(`../package.json`)

export const log: makeDebug.IDebugger = Object.assign(makeDebug(packageName), {
  log: console.log,
})

export const error: makeDebug.IDebugger = makeDebug(packageName)

export const getDb = (url = config.db.url): knex =>
  knex({
    client: `pg`,
    connection: url,
  })

const parseProviders = (providers: ProviderConfig): [string, ProviderData][] =>
  Object.entries(providers)

const providerName = (name: string): string => `${__dirname}/providers/${name}`

export interface ProviderConstructorData {
  constructors: ProviderConstructor[]
  providerConfig: ProviderConfig
}

export const getProviderConstructors = async (
  providers = parseProviders(config.providers)
): Promise<ProviderConstructorData> => {
  const modules = await Promise.all(
    providers.map(([name]) => import(providerName(name)))
  )
  return {
    constructors: modules.map(module => module.default),
    providerConfig: config.providers,
  }
}

export const onlyNumber = (a: number): number | null =>
  Number.isNaN(a) ? null : a

export const parseEp = (a: string): number | null =>
  onlyNumber(+(a.trim().match(/\d+(?:\.\d+)?$/) || [])[0])

export const range = function*(a: number, b: number): IterableIterator<number> {
  for (let i = a; i <= b; i += 1) {
    yield i
  }
}
interface FormDataPrivate {
  _lastBoundary(): string
  _multiPartHeader(a: string, b: string | number, c: Object): string
}
namespace FormDataPrivate {
  export interface Constructor {
    LINE_BREAK: string
  }

  export const Constructor = <Constructor>(<any>FormData)
}

export const buildFormBody = (
  formData: FormData,
  fields: { [key: string]: string | number }
): string => {
  const formDataPrivate = <FormDataPrivate>(<any>formData)
  return (
    Object.entries(fields)
      .map(([field, value]) =>
        [formDataPrivate._multiPartHeader(field, value, {}), value].join(``)
      )
      .concat(``)
      .join(FormDataPrivate.Constructor.LINE_BREAK) +
    formDataPrivate._lastBoundary()
  )
}

export const entriesToObj = <T>(entries: [string, T][]): { [key: string]: T } =>
  entries.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

export const filterObjValues = <T>(
  a: { [key: string]: T },
  fn: (a: T) => boolean = truthy
): { [key: string]: T } =>
  entriesToObj(Object.entries(a).filter(([_, a]) => fn(a)))

export const id = <T>(a: T): T => a

export const truthy = <T>(a: T): boolean => !!a
