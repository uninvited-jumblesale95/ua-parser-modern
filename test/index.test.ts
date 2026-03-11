import type { IBrowser, ICPU, IDevice, IEngine, IOS, IResult, ParserExtensions } from '../src/index'
import { describe, expect, it } from 'vitest'
import {
  BROWSER,
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
  parseUA,
} from '../src/index'
import browsers from './fixtures/browser-test.json'
import cpus from './fixtures/cpu-test.json'
import devices from './fixtures/device-test.json'
import engines from './fixtures/engine-test.json'
import os from './fixtures/os-test.json'

interface FixtureEntry {
  desc: string
  ua?: string
  expect: Record<string, string>
}

interface MethodFixture {
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

  it('memoizes parsed sections on repeated getter access', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    const result = parseUA(ua)
    const first = result.browser
    first.name = 'changed'

    const second = result.browser
    expect(second).toBe(first)
    expect(second.name).toBe('changed')
  })

  it('creates parser context lazily', () => {
    const extensions = {} as ParserExtensions
    Object.defineProperty(extensions, 'browser', {
      configurable: true,
      enumerable: true,
      get() {
        throw new Error('context-created')
      },
    })

    const result = parseUA(undefined, extensions)
    expect(() => result.browser).toThrowError('context-created')
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
    const myOwnBrowser = [[/(myownbrowser)\/((\d+)?[\w.]+)/i], [BROWSER.NAME, BROWSER.VERSION, BROWSER.MAJOR]]

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

describe('user-agent length', () => {
  it('greater than 500 chars should be trimmed down', () => {
    const uaString = `Mozilla/5.0 ${'x'.repeat(600)}`
    expect(parseUA(uaString).ua.length).toBe(500)
  })
})
