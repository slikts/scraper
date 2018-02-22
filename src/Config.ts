import fs from 'fs'
import knex from 'knex'
import toml from 'toml'
import { IProviderConfig } from './Provider'

export interface IRunnerOpts {
  userAgent: string
  dryRun: boolean
  debugItems: boolean
  debugNames: boolean
}

export interface IConfig {
  db: {
    url: string
  }
  runner: IRunnerOpts
  providers: IProviderConfig
}

export const config: IConfig = toml.parse(
  fs.readFileSync(`${__dirname}/../config/config.toml`, `utf8`)
)
