import Provider from '../Provider'
import {
  log,
  error,
  parseEp,
  range,
  buildFormBody,
  filterObjValues,
  truthy,
} from '../util'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import Item from '../Item'
import { ScrapeOptions } from '@slikts/scrape-it'
import { AllHtmlEntities as Entities } from 'html-entities'
import { config } from '../Config'

const schema: ScrapeOptions = {
  items: {
    listItem: `.menulast a`,
    data: {
      key: {
        attr: 'href',
      },
      fullName: {
        how: 'html',
      },
    },
  },
}
const entities = new Entities()
const doubleDecode = (a: string): string => entities.decode(entities.decode(a))

export interface SchemaItem {
  key: string
  fullName: string
}

const namePattern = /^(?<name>.+?)(?: Season (?<season>\d+))?( Episode (?<ep>\d+))?( English (?<type>Subbed|Dubbed))?( - (?<epTitle>.+))?$/

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

const matchFullName = (rawName: string): NameGroups => {
  const match = <NameMatch>rawName.match(namePattern)

  const { name, season, ep, type, epTitle } =
    (match && match.groups) ||
    <NameGroups>{
      name: rawName,
    }
  if (config.runner.debugNames) {
    log(
      'name %o',
      rawName,
      filterObjValues({ name, season, ep, type, epTitle })
    )
  }
  return {
    name,
    season,
    ep,
    type,
    epTitle,
  }
}

const makeFullEp = (ep: string, season?: string): string =>
  !season ? ep : `S${season.padStart(2, '0')}E${ep.padStart(2, '0')}`

export default class WatchCartoonOnline implements Provider {
  url: string
  base: string
  schema: ScrapeOptions
  maxPages: number
  constructor({
    base = `https://sile.untu.ms/scrape/wco.html`,
    maxPages = 3,
  } = {}) {
    this.base = base
    this.maxPages = maxPages
    this.url = `https://www.watchcartoononline.com/`
    this.schema = schema
  }

  flatten({ data: { items } }: { data: { items: SchemaItem[] } }): Item[] {
    const time = new Date()
    return items
      .map(({ key, fullName }) => ({
        key,
        fullName: doubleDecode(fullName),
      }))
      .map(({ key, fullName }) => ({
        key,
        fullName,
        nameMatches: matchFullName(fullName),
      }))
      .filter(({ nameMatches }) => nameMatches)
      .map(({ key, fullName, nameMatches }) => {
        const { name, season, ep, type, epTitle } = nameMatches!
        return {
          key,
          time,
          group: name,
          data: filterObjValues({
            fullName,
            ep,
            season,
            type,
            epTitle,
          }),
          source: this.constructor.name,
          name: `${name} ${ep ? makeFullEp(ep, season) : ``}`.trim(),
        }
      })
  }

  *pages() {
    for (const page of range(0, 2)) {
      yield {
        url: this.base,
        headers: {
          'x-requested-with': `XMLHttpRequest`,
          origin: `https://www.watchcartoononline.com`,
          referer: `https://www.watchcartoononline.com/`,
        },
      }
    }
  }
}
