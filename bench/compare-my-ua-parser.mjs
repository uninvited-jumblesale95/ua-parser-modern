import fs from 'node:fs'

import UAParser from 'my-ua-parser'
import { Bench } from 'tinybench'

import {
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
  parseUA,
} from '../dist/index.mjs'

const FIXTURE_FILES = [
  'browser-test.json',
  'cpu-test.json',
  'device-test.json',
  'engine-test.json',
  'os-test.json',
]

const BENCH_OPTIONS = {
  time: 750,
  warmupTime: 250,
}

function loadFixtures() {
  const fixtureRoot = new URL('../test/fixtures/', import.meta.url)
  const uas = []

  for (const file of FIXTURE_FILES) {
    const filePath = new URL(file, fixtureRoot)
    const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    for (const entry of entries) {
      if (typeof entry?.ua === 'string' && entry.ua.length > 0)
        uas.push(entry.ua)
    }
  }

  return [...new Set(uas)]
}

function runDataset(uas, parse) {
  for (const ua of uas)
    parse(ua)
}

function formatOps(value) {
  return Number.isFinite(value)
    ? Math.round(value).toLocaleString('en-US')
    : 'n/a'
}

function formatMs(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(3)} ms`
    : 'n/a'
}

function tableRow(columns, widths) {
  return columns
    .map((value, index) => String(value).padEnd(widths[index]))
    .join('  ')
}

function buildTable(rows) {
  const widths = rows[0].map((_, index) =>
    Math.max(...rows.map(row => String(row[index]).length)))

  return rows.map(row => tableRow(row, widths)).join('\n')
}

async function runScenario(uas, name, ours, mine) {
  const bench = new Bench(BENCH_OPTIONS)
  bench
    .add('ours', () => runDataset(uas, ours))
    .add('my-ua-parser', () => runDataset(uas, mine))

  await bench.run()

  const oursTask = bench.tasks.find(task => task.name === 'ours')
  const mineTask = bench.tasks.find(task => task.name === 'my-ua-parser')

  const oursHz = oursTask?.result?.hz ?? Number.NaN
  const mineHz = mineTask?.result?.hz ?? Number.NaN
  const oursMean = oursTask?.result?.mean ?? Number.NaN
  const mineMean = mineTask?.result?.mean ?? Number.NaN
  const ratio = Number.isFinite(oursHz) && Number.isFinite(mineHz) && mineHz !== 0
    ? oursHz / mineHz
    : Number.NaN

  return {
    name,
    oursHz,
    mineHz,
    oursMean,
    mineMean,
    ratio,
  }
}

async function main() {
  const distEntry = new URL('../dist/index.mjs', import.meta.url)
  if (!fs.existsSync(distEntry)) {
    throw new Error('Missing dist/index.mjs. Run `pnpm build` before running benchmarks.')
  }

  const uas = loadFixtures()

  const scenarios = [
    {
      name: 'full',
      ours: (ua) => {
        const result = parseUA(ua)
        void result.browser
        void result.engine
        void result.os
        void result.device
        void result.cpu
      },
      mine: ua => UAParser(ua),
    },
    {
      name: 'browser',
      ours: parseBrowser,
      mine: ua => new UAParser(ua).getBrowser(),
    },
    {
      name: 'cpu',
      ours: parseCPU,
      mine: ua => new UAParser(ua).getCPU(),
    },
    {
      name: 'device',
      ours: parseDevice,
      mine: ua => new UAParser(ua).getDevice(),
    },
    {
      name: 'engine',
      ours: parseEngine,
      mine: ua => new UAParser(ua).getEngine(),
    },
    {
      name: 'os',
      ours: parseOS,
      mine: ua => new UAParser(ua).getOS(),
    },
  ]

  const results = []
  for (const scenario of scenarios)
    results.push(await runScenario(uas, scenario.name, scenario.ours, scenario.mine))

  const rows = [
    ['scenario', 'ours ops/s', 'mine ops/s', 'ours mean', 'mine mean', 'ratio'],
    ...results.map(result => [
      result.name,
      formatOps(result.oursHz),
      formatOps(result.mineHz),
      formatMs(result.oursMean),
      formatMs(result.mineMean),
      Number.isFinite(result.ratio) ? `${result.ratio.toFixed(2)}x` : 'n/a',
    ]),
  ]

  console.log(`UAs: ${uas.length} unique (from ${FIXTURE_FILES.length} fixture files)`)
  console.log('')
  console.log(buildTable(rows))
}

await main()
