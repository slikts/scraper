const Provider = require(`../src/Provider`)
const { debug, parseEp, range, buildFormBody } = require(`../src/util`)
const { parseDate } = require(`chrono-node`)
const FormData = require(`form-data`)

const schema = {
  items: {
    listItem: `.ep-box`,
    data: {
      group: `.name`,
      key: {
        selector: `.fa-play`,
        attr: `href`,
      },
      time: {
        selector: `.date_homepage`,
        convert: parseDate,
      },
      seriesUrl: {
        selector: `.eh-inner .fa-file-text-o`,
        attr: `href`,
      },
      episode: {
        selector: `.ep-no`,
        convert: parseEp,
      },
    },
  },
}

class OtakuStream extends Provider {
  // constructor({ base = `https://sile.untu.ms/scrape/otakustream.html`, maxPages } = {}) {
  constructor({ base = `https://otakustream.tv/api/tools.php`, maxPages } = {}) {
    debug(`base`, base)
    super(base, maxPages)
    this.name = `OtakuStream`
    this.url = `http://otakustream.tv/`
    this.schema = schema
  }

  // eslint-disable-next-line class-methods-use-this
  flatten({ items }) {
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
      const formData = new FormData()
      const formBody = buildFormBody(formData, {
        action: `recent_release`,
        ...(page ? { offset: page * 10 } : {}),
      })

      yield {
        url: this.base,
        headers: {
          'x-requested-with': `XMLHttpRequest`,
          origin: `https://otakustream.tv`,
          referer: `https://otakustream.tv/`,
          ...formData.getHeaders(),
        },
        method: `POST`,
        data: formBody,
      }
    }
  }
}

module.exports = OtakuStream
