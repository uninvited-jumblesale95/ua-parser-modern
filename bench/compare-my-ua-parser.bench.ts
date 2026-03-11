import fs from 'node:fs'

import UAParser from 'my-ua-parser'
import { bench, describe } from 'vitest'

import {
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
  parseUA,
} from '../src/index'

const FIXTURE_FILES = [
  'browser-test.json',
  'cpu-test.json',
  'device-test.json',
  'engine-test.json',
  'os-test.json',
] as const

const BENCH_OPTIONS = {
  time: 750,
  warmupTime: 250,
}

function loadFixtures(): string[] {
  const fixtureRoot = new URL('../test/fixtures/', import.meta.url)
  const uas: string[] = []

  for (const file of FIXTURE_FILES) {
    const filePath = new URL(file, fixtureRoot)
    const entries = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<{ ua?: unknown }>
    for (const entry of entries) {
      if (typeof entry?.ua === 'string' && entry.ua.length > 0)
        uas.push(entry.ua)
    }
  }

  return [...new Set(uas)]
}

function runDataset(uas: readonly string[], parse: (ua: string) => unknown): void {
  for (const ua of uas)
    parse(ua)
}

const uas = loadFixtures()

const scenarios = [
  {
    name: 'full',
    ours: (ua: string): void => {
      const result = parseUA(ua)
      void result.browser
      void result.engine
      void result.os
      void result.device
      void result.cpu
    },
    mine: (ua: string): unknown => UAParser(ua),
  },
  {
    name: 'browser',
    ours: (ua: string): unknown => parseBrowser(ua),
    mine: (ua: string): unknown => new UAParser(ua).getBrowser(),
  },
  {
    name: 'cpu',
    ours: (ua: string): unknown => parseCPU(ua),
    mine: (ua: string): unknown => new UAParser(ua).getCPU(),
  },
  {
    name: 'device',
    ours: (ua: string): unknown => parseDevice(ua),
    mine: (ua: string): unknown => new UAParser(ua).getDevice(),
  },
  {
    name: 'engine',
    ours: (ua: string): unknown => parseEngine(ua),
    mine: (ua: string): unknown => new UAParser(ua).getEngine(),
  },
  {
    name: 'os',
    ours: (ua: string): unknown => parseOS(ua),
    mine: (ua: string): unknown => new UAParser(ua).getOS(),
  },
]

describe('my-ua-parser comparison', () => {
  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      bench('ours', () => runDataset(uas, scenario.ours), BENCH_OPTIONS)
      bench('my-ua-parser', () => runDataset(uas, scenario.mine), BENCH_OPTIONS)
    })
  }
})
