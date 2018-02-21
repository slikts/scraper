import toml from 'toml'
import knex from 'knex'
import fs from 'fs'
import { ProviderConfig } from './Provider'

export namespace Config {
  export interface RunnerOpts {
    userAgent: string
    dryRun: boolean
    debugItems: boolean
    debugNames: boolean
  }
}

export interface Config {
  db: {
    url: string
  }
  runner: Config.RunnerOpts
  providers: ProviderConfig
}

export const config: Config = toml.parse(
  fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`)
)
