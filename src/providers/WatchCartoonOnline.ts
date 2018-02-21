import Provider from '../Provider'
import { log, parseEp, range, buildFormBody } from '../util'
import { parseDate } from 'chrono-node'
import FormData from 'form-data'
import Item from '../Item'
import { ScrapeOptions } from 'scrape-it'

const schema: ScrapeOptions = {
  items: {
    listItem: `.menulast a`,
    data: {
      url: {
        attr: 'href',
      },
    },
  },
}

export interface SchemaItem {
  group: string
  key: string
  time: Date
  episode: number
  seriesUrl: string
}

export default class WatchCartoonOnline implements Provider {
  name: string
  url: string
  base: string
  schema: ScrapeOptions
  maxPages: number
  constructor({ base = `https://sile.untu.ms/scrape/wco.html`, maxPages = 3 } = {}) {
    this.base = base
    this.maxPages = maxPages
    this.name = `OtakuStream`
    this.url = `http://otakustream.tv/`
    this.schema = schema
  }

  // eslint-disable-next-line class-methods-use-this
  flatten({ data: { items } }: { data: { items: SchemaItem[] } }): Item[] {
    return items.map(({ group, key, time, episode, seriesUrl }) => ({
      key,
      time,
      group,
      data: {
        episode,
        seriesUrl,
      },
      source: this.name,
      name: `${group} ${episode}`,
    }))
  }

  *pages() {
    for (const page of range(0, 2)) {
      // const formData = new FormData()
      // const formBody = buildFormBody(formData, {
      //   action: `recent_release`,
      //   ...(page ? { offset: page * 10 } : {})
      // })

      yield {
        url: this.base,
        headers: {
          'x-requested-with': `XMLHttpRequest`,
          origin: `https://www.watchcartoononline.com`,
          referer: `https://www.watchcartoononline.com/`,
          // ...formData.getHeaders()
        },
        // method: `POST`,
        // data: formBody
      }
    }
  }
}
