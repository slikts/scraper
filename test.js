import test from 'ava'
// import knex from 'knex'
import Reader from './providers/Reader'
import Runner from './src/Runner'
import { getDb, debug } from './src/util'

const run = provider => new Runner(provider, getDb()).run()

test(`Reader`, async t => {
  await run(new Reader({ base: `https://sile.untu.ms/scrape/latest-releases.html` }))
  // debug({ ...Reader, base: `https://sile.untu.ms/scrape/latest-releases.html` })
  t.pass()
})

// test('bar', async t => {
//   const bar = Promise.resolve('bar')

//   t.is(await bar, 'bar')
// })
