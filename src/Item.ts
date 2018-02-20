export default interface Item {
  readonly key: string
  readonly group: string
  readonly source: string
  readonly time: Date
  readonly name: string
  readonly data: Object
}
