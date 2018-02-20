import Provider from '../Provider'
import { debug, range, parseEp } from '../util'
import { ScrapeOptions } from 'scrape-it'

const itemSchema = {
  listItem: `dd a`,
  data: {
    url: {
      attr: `href`,
    },
    chapter: {
      how: `html`,
      convert: parseEp,
    },
  },
}

const titleSchema: ScrapeOptions = {
  titles: {
    listItem: `.manga_updates dl`,
    data: {
      name: `.manga_info`,
      date: {
        selector: `.time`,
        convert: (x: string) =>
          new Date(
            x
              .split(`/`)
              .reverse()
              .join(`-`)
          ),
      },
      items: itemSchema,
    },
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
  name: string
  url: string
  base: string
  schema: ScrapeOptions
  maxPages: number
  constructor({ base = `https://www.readmng.com/latest-releases`, maxPages = 3 } = {}) {
  // constructor({ base = `https://sile.untu.ms/scrape/latest-releases.html`, maxPages = 3 } = {}) {
    this.name = `ReadMangaToday`
    this.url = `http://readmanga.today/`
    this.base = base
    this.schema = titleSchema
    this.maxPages = maxPages
  }

  flatten({ data: { titles } }: { data: { titles: SchemaTitle[] } }) {
    return titles
      .map(({ name, date, items }) =>
        items.map(({ url, chapter }) => ({
          key: url,
          time: date,
          group: name,
          data: {
            chapter,
          },
          source: this.name,
          name: `${name} ${chapter}`,
        }))
      )
      .reduce((a, b) => a.concat(b), [])
  }

  *pages() {
    const makeUrl = (n: number) => ({
      url: `${this.base}${n > 1 ? `/${n}` : ``}`,
    })
    yield* [...range(1, this.maxPages)].map(makeUrl)
  }
}
