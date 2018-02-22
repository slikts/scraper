import makeDebug from 'debug'
import FormData from 'form-data'
import knex from 'knex'
import { config } from './Config'
import { ProviderConfig, ProviderConstructor, ProviderData } from './Provider'

// tslint:disable-next-line:no-var-requires
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

const parseProviders = (
  providers: ProviderConfig
): Array<[string, ProviderData]> => Object.entries(providers)

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
  _multiPartHeader(a: string, b: string | number, c: object): string
}

interface FormDataPrivateConstructor {
  LINE_BREAK: string
}

const FormDataPrivate = (FormData as any) as FormDataPrivateConstructor

export const buildFormBody = (
  formData: FormData,
  fields: { [key: string]: string | number }
): string => {
  const formDataPrivate = (formData as any) as FormDataPrivate
  return (
    Object.entries(fields)
      .map(([field, value]) =>
        [formDataPrivate._multiPartHeader(field, value, {}), value].join(``)
      )
      .concat(``)
      .join(FormDataPrivate.LINE_BREAK) + formDataPrivate._lastBoundary()
  )
}

export const entriesToObj = <T>(
  entries: Array<[string, T]>
): { [key: string]: T } =>
  entries.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

export const filterObjValues = <T>(
  a: { [key: string]: T },
  fn: (a: T) => boolean = truthy
): { [key: string]: T } =>
  entriesToObj(Object.entries(a).filter(([_, b]) => fn(b)))

export const id = <T>(a: T): T => a

export const truthy = <T>(a: T): boolean => !!a
