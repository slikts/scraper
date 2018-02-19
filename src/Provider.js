const validate = provider => {
  const proto = Object.getPrototypeOf(provider)
  if (![`pages`, `flatten`].every(a => proto[a])) {
    throw TypeError(`Provider interface mismatch`)
  }
}

class Provider {
  constructor(base, maxPages = 10) {
    this.base = base
    this.maxPages = maxPages
    validate(this)
  }

  *pages() {
    const makeUrl = n => ({
      url: `${this.base}${n > 1 ? `/${n}` : ``}`,
    })
    for (let i = 1; i <= this.maxPages; i += 1) {
      yield makeUrl(i)
    }
  }
}

module.exports = Provider
