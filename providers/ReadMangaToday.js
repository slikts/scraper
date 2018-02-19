const Provider = require(`../src/Provider`)
const { parseEp } = require(`../src/util`)

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

const titleSchema = {
  titles: {
    listItem: `.manga_updates dl`,
    data: {
      name: `.manga_info`,
      date: {
        selector: `.time`,
        convert: x =>
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

class ReadMangaToday extends Provider {
  constructor({ base = `https://www.readmng.com/latest-releases`, maxPages } = {}) {
    super(maxPages)
    this.name = `ReadMangaToday`
    this.url = `http://readmanga.today/`
    this.base = base
    this.schema = titleSchema
    this.maxPages = maxPages
  }

  flatten({ titles }) {
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
}

module.exports = ReadMangaToday
