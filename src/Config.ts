import fs from 'fs'
import knex from 'knex'
import toml from 'toml'
import { ProviderConfigGroups } from './Provider'

export interface RunnerOpts {
  userAgent: string
  dryRun: boolean
  debugItems: boolean
  debugNames: boolean
}

export interface Config {
  db: {
    url: string
  }
  runner: RunnerOpts
  providers: ProviderConfigGroups
}

export const config: Config = toml.parse(
  fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`)
)
