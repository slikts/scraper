import { ScrapeOptions } from '@slikts/scrape-it'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import { AllHtmlEntities as Entities } from 'html-entities'
import { config } from '../Config'
import Item from '../Item'
import { ScrapeProvider } from '../Provider'
import {
  buildFormBody,
  error,
  filterObjValues,
  log,
  makeFullEp,
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

export default class WatchCartoonOnline implements ScrapeProvider {
  readonly url: string
  readonly base: string
  readonly schema: ScrapeOptions
  readonly maxPages: number
  constructor({
    base = `https://www.watchcartoononline.io/last-50-recent-release`,
  } = {}) {
    this.base = base
    this.maxPages = 1
    this.url = `https://www.watchcartoononline.com/`
    this.schema = schema
  }

  flatten({
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

  *pages() {
    for (const page of range(0, 2)) {
      yield {
        headers: {
          origin: `https://www.watchcartoononline.com`,
          referer: `https://www.watchcartoononline.com/`,
        },
        url: this.base,
      }
    }
  }
}
