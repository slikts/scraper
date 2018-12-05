import { ScrapeOptions } from '@slikts/scrape-it'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import { AllHtmlEntities as Entities } from 'html-entities'
import { config } from '../Config'
import Item from '../Item'
import { FeedProvider } from '../Provider'
import {
  buildFormBody,
  error,
  filterObjValues,
  log,
  parseEp,
  range,
  truthy,
} from '../util'

export default class Nyaa implements FeedProvider {
  readonly url: string
  readonly base: string
  readonly maxPages: number
  constructor({ base = `https://nyaa.si/?page=rss&c=1_2` } = {}) {
    this.base = base
    this.maxPages = 1
    this.url = `https://nyaa.si`
  }

  flatten({ data: { items } }: { data: { items: SchemaItem[] } }): Item[] {
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
          origin: this.url,
          referer: `${this.url}/`,
        },
        url: this.base,
      }
    }
  }
}
