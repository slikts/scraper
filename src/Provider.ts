import Item from './Item'

export default interface Provider {
  readonly name: String
  readonly url: String
  readonly base: String
  readonly schema: Object
  readonly maxPages: number
  flatten(a: Object): Item[]
}
