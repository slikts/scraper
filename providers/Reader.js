module.exports = { abc: 1 }

const source = {
  name: `ReadMangaToday`,
  url: `http://readmanga.today/`,
  // base: `https://sile.untu.ms/scrape/latest-releases.html`,
  base: `https://www.readmng.com/latest-releases`,
}

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

const flatten = ({ titles }) =>
  titles
    .map(({ name, date, items }) =>
      items.map(({ url, chapter }) => ({
        key: url,
        time: date,
        group: name,
        data: {
          chapter,
        },
        source: source.name,
        name: `${name} ${chapter}`,
      }))
    )
    .reduce((a, b) => a.concat(b), [])

const makeUrl = n => `${source.base}${n > 1 ? `/${n}` : ``}`
const maxPages = 10
const pages = function*() {
  for (let i = 1; i <= maxPages; i += 1) {
    yield makeUrl(i)
  }
}

module.exports = {
  ...source,
  pages,
  schema: titleSchema,
  flatten,
}
