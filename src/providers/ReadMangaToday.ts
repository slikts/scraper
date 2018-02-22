import { ScrapeOptions } from '@slikts/scrape-it'
import Provider, { Page } from '../Provider'
import { log, parseEp, range } from '../util'

const itemSchema = {
  data: {
    chapter: {
      convert: parseEp,
      how: `html`,
    },
    url: {
      attr: `href`,
    },
  },
  listItem: `dd a`,
}

const titleSchema: ScrapeOptions = {
  titles: {
    data: {
      date: {
        convert: (x: string) =>
          new Date(
            x
              .split(`/`)
              .reverse()
              .join(`-`)
          ),
        selector: `.time`,
      },
      items: itemSchema,
      name: `.manga_info`,
    },
    listItem: `.manga_updates dl`,
  },
}

export interface SchemaTitle {
  name: string
  date: Date
  items: SchemaItem[]
}

export interface SchemaItem {
  url: string
  chapter: number
}

export default class ReadMangaToday implements Provider {
  public url: string
  public base: string
  public schema: ScrapeOptions
  public maxPages: number
  constructor({
    base = `https://www.readmng.com/latest-releases`,
    maxPages = 3,
  } = {}) {
    this.url = `http://readmanga.today/`
    this.base = base
    this.schema = titleSchema
    this.maxPages = maxPages
  }

  public flatten({ data: { titles } }: { data: { titles: SchemaTitle[] } }) {
    return titles
      .map(({ name, date, items }) =>
        items.map(({ url, chapter }) => ({
          data: {
            chapter,
          },
          group: name,
          key: `${url}/all-pages`,
          name: `${name} ${chapter}`,
          source: this.constructor.name,
          time: date,
        }))
      )
      .reduce((a, b) => a.concat(b), [])
  }

  public *pages() {
    const makeUrl = (n: number) => ({
      url: `${this.base}${n > 1 ? `/${n}` : ``}`,
    })
    yield* [...range(1, this.maxPages)].map(makeUrl)
  }
}
