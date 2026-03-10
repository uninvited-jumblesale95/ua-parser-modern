import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import safe from 'safe-regex'
import { describe, expect, it } from 'vitest'
import {
  BROWSER,
  parseUA,
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
} from '../src/index'
import type { IBrowser, ICPU, IDevice, IEngine, IResult, IOS } from '../src/index'
import browsers from './fixtures/browser-test.json'
import cpus from './fixtures/cpu-test.json'
import devices from './fixtures/device-test.json'  
import engines from './fixtures/engine-test.json'
import os from './fixtures/os-test.json'

type FixtureEntry = {
  desc: string
  ua?: string
  expect: Record<string, string>
}

type MethodFixture = {
  title: string
  label: keyof IResult
  parse: (ua?: string) => IBrowser | ICPU | IDevice | IEngine | IOS
  list: FixtureEntry[]
  properties: string[]
}

const methods: MethodFixture[] = [
  {
    title: 'parseBrowser',
    label: 'browser',
    parse: parseBrowser,
    list: browsers as FixtureEntry[],
    properties: ['name', 'major', 'version'],
  },
  {
    title: 'parseCPU',
    label: 'cpu',
    parse: parseCPU,
    list: cpus as FixtureEntry[],
    properties: ['architecture'],
  },
  {
    title: 'parseDevice',
    label: 'device',
    parse: parseDevice,
    list: devices as FixtureEntry[],
    properties: ['model', 'type', 'vendor'],
  },
  {
    title: 'parseEngine',
    label: 'engine',
    parse: parseEngine,
    list: engines as FixtureEntry[],
    properties: ['name', 'version'],
  },
  {
    title: 'parseOS',
    label: 'os',
    parse: parseOS,
    list: os as FixtureEntry[],
    properties: ['name', 'version'],
  },
]

describe('parseUA', () => {
  it('returns composed parser output', () => {
    const ua = 'Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6'
    expect(parseUA(ua)).toEqual({
      ua,
      browser: parseBrowser(ua),
      engine: parseEngine(ua),
      os: parseOS(ua),
      device: parseDevice(ua),
      cpu: parseCPU(ua),
    })
  })

  it('does not throw with undefined ua argument', () => {
    expect(() => parseUA(undefined)).not.toThrow()
  })
})

for (const method of methods) {
  describe(method.title, () => {
    for (const entry of method.list) {
      if (!entry.ua)
        continue

      for (const property of method.properties) {
        it(`[${entry.desc}] \"${entry.ua}\" -> ${String(method.label)}.${property}`, () => {
          const expectedValue = entry.expect[property]
          const result = method.parse(entry.ua) as unknown as Record<string, unknown>

          expect(result[property]).toBe(
            expectedValue !== 'undefined' ? expectedValue : undefined,
          )
        })
      }
    }
  })
}

describe('default result shape', () => {
  it('returns the expected JSON object', () => {
    expect(parseUA('')).toEqual({
      ua: '',
      browser: { name: undefined, version: undefined, major: undefined },
      cpu: { architecture: undefined },
      device: { vendor: undefined, model: undefined, type: undefined },
      engine: { name: undefined, version: undefined },
      os: { name: undefined, version: undefined },
    })
  })
})

describe('regex extension', () => {
  it('extends browser regex map', () => {
    const uaString = 'Mozilla/5.0 MyOwnBrowser/1.3'
    const myOwnBrowser = [[/(myownbrowser)\/((\d+)?[\w\.]+)/i], [BROWSER.NAME, BROWSER.VERSION, BROWSER.MAJOR]]

    const browserFromUA = parseBrowser(uaString, { browser: myOwnBrowser })
    expect(browserFromUA.name).toBe('MyOwnBrowser')
    expect(browserFromUA.version).toBe('1.3')
    expect(browserFromUA.major).toBe('1')

    const browserFromExtOnly = parseBrowser({ browser: myOwnBrowser })
    expect(browserFromExtOnly.name).toBeUndefined()

    const resultFromUA = parseUA(uaString, { browser: myOwnBrowser })
    expect(resultFromUA.browser.name).toBe('MyOwnBrowser')
    expect(resultFromUA.browser.version).toBe('1.3')
  })
})

describe('User-agent length', () => {
  it('greater than 500 chars should be trimmed down', () => {
    const uaString = `Mozilla/5.0 ${'x'.repeat(600)}`
    expect(parseUA(uaString).ua.length).toBe(500)
  })
})

describe('regex safety', () => {
  it('all regexes in src/index.ts are safe-regex compatible', () => {
    const code = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    const regexes: string[] = []
    traverse(ast, {
      RegExpLiteral(path: any) {
        regexes.push(path.node.pattern)
      },
    })

    expect(regexes.length).toBeGreaterThan(0)

    for (const regex of regexes)
      expect(safe(regex), `unsafe regex: ${regex}`).toBe(true)
  })
})
