import { ScrapeOptions } from '@slikts/scrape-it'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import { AllHtmlEntities as Entities } from 'html-entities'
import { config } from '../Config'
import Item from '../Item'
import Provider from '../Provider'
import {
  buildFormBody,
  error,
  filterObjValues,
  log,
  parseEp,
  range,
  truthy,
} from '../util'

const schema: ScrapeOptions = {
  items: {
    data: {
      fullName: {
        how: 'html',
      },
      key: {
        attr: 'href',
      },
    },
    listItem: `.menulast a`,
  },
}
const entities = new Entities()
const doubleDecode = (a: string): string => entities.decode(entities.decode(a))

export interface SchemaItem {
  key: string
  fullName: string
}

const namePattern = /^(?<name>.+?)(?: Season (?<season>\d+))?( Episode (?<ep>\d+))( English (?<type>Subbed|Dubbed))?( - (?<epTitle>.+))?$/

interface NameGroups {
  [key: string]: any
  name: string
  season?: string
  ep?: string
  type?: 'Subbed' | 'Dubbed'
  epTitle?: string
}

interface NameMatch extends RegExpMatchArray {
  groups: NameGroups
}

const matchFullName = (rawName: string): NameGroups | null => {
  const match = rawName.match(namePattern)
  const { debugNames } = config.runner
  if (!match) {
    if (debugNames) {
      log('skipping name %o', rawName)
    }
    return null
  }
  const { name, season, ep, type, epTitle } = match.groups as NameGroups
  const result = { name, season, ep, type, epTitle }
  if (debugNames) {
    log('name %o', rawName, filterObjValues(result))
  }
  return result
}

const makeFullEp = (ep: string, season?: string): string =>
  !season ? ep : `S${season.padStart(2, '0')}E${ep.padStart(2, '0')}`

export default class WatchCartoonOnline implements Provider {
  public url: string
  public base: string
  public schema: ScrapeOptions
  public maxPages: number
  constructor({
    base = `https://www.watchcartoononline.io/last-50-recent-release`,
  } = {}) {
    this.base = base
    this.maxPages = 1
    this.url = `https://www.watchcartoononline.com/`
    this.schema = schema
  }

  public flatten({
    data: { items },
  }: {
    data: { items: SchemaItem[] }
  }): Item[] {
    const time = new Date()
    return items
      .map(({ key, fullName }) => ({
        fullName: doubleDecode(fullName),
        key,
      }))
      .map(({ key, fullName }) => ({
        fullName,
        key,
        nameMatches: matchFullName(fullName),
      }))
      .filter(({ nameMatches }) => nameMatches)
      .map(({ key, fullName, nameMatches }) => {
        const { name, season, ep, type, epTitle } = nameMatches!
        return {
          data: filterObjValues({
            ep,
            epTitle,
            fullName,
            season,
            type,
          }),
          group: [name, type].filter(truthy).join(' '),
          key,
          name: [
            name,
            type,
            ep && makeFullEp(ep, season),
            epTitle && `- ${epTitle}`,
          ]
            .filter(truthy)
            .join(' '),
          source: this.constructor.name,
          time,
        }
      })
  }

  public *pages() {
    for (const page of range(0, 2)) {
      yield {
        headers: {
          origin: `https://www.watchcartoononline.com`,
          referer: `https://www.watchcartoononline.com/`,
          'x-requested-with': `XMLHttpRequest`,
        },
        url: this.base,
      }
    }
  }
}
