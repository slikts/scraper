const itemSchema = {
  listItem: `dd a`,
  data: {
    url: {
      attr: `href`,
    },
    chapter: {
      how: `html`,
      convert: x => +x.trim().match(/\d+(?:\.\d+)?$/)[0],
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

class ReadMangaToday {
  constructor({ base = `https://www.readmng.com/latest-releases`, maxPages = 10 } = {}) {
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

  *pages() {
    const makeUrl = n => `${this.base}${n > 1 ? `/${n}` : ``}`
    for (let i = 1; i <= this.maxPages; i += 1) {
      yield makeUrl(i)
    }
  }
}

module.exports = ReadMangaToday
