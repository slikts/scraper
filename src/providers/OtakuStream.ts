import { ScrapeOptions } from '@slikts/scrape-it'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import { config } from '../Config'
import Item from '../Item'
import Provider from '../Provider'
import { buildFormBody, log, parseEp, range } from '../util'

const schema: ScrapeOptions = {
  items: {
    data: {
      episode: {
        convert: parseEp,
        selector: `.ep-no`,
      },
      group: `.name`,
      key: {
        attr: `href`,
        selector: `.fa-play`,
      },
      seriesUrl: {
        attr: `href`,
        selector: `.eh-inner .fa-file-text-o`,
      },
      time: {
        convert: parseDate,
        selector: `.date_homepage`,
      },
    },
    listItem: `.ep-box`,
  },
}

export interface SchemaItem {
  group: string
  key: string
  time: Date
  episode: number | null
  seriesUrl: string
}

export default class OtakuStream implements Provider {
  public url: string
  public base: string
  public schema: ScrapeOptions
  public maxPages: number
  constructor({
    base = `https://otakustream.tv/api/tools.php`,
    maxPages = 3,
  } = {}) {
    this.base = base
    this.maxPages = maxPages
    this.url = `http://otakustream.tv/`
    this.schema = schema
  }

  public flatten({
    data: { items },
  }: {
    data: { items: SchemaItem[] }
  }): Item[] {
    return items
      .filter(({ episode }) => episode)
      .map(({ group, key, time, episode, seriesUrl }) => ({
        data: {
          episode,
          seriesUrl,
        },
        group,
        key,
        name: `${group} ${episode}`,
        source: this.constructor.name,
        time,
      }))
  }

  public *pages() {
    for (const page of range(0, 2)) {
      const formData = new FormData()
      const formBody = buildFormBody(formData, {
        action: `recent_release`,
        ...(page ? { offset: page * 10 } : {}),
      })

      yield {
        data: formBody,
        headers: {
          origin: `https://otakustream.tv`,
          referer: `https://otakustream.tv/`,
          'x-requested-with': `XMLHttpRequest`,
          ...formData.getHeaders(),
        },
        method: `POST`,
        url: this.base,
      }
    }
  }
}
