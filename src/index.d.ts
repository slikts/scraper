declare module 'chrono-node' {
  export function parseDate(a: string): Date
}

// https://github.com/Microsoft/TypeScript/issues/22082
interface RegExpMatchArray {
  groups: {
    [key: string]: string
  }
}
