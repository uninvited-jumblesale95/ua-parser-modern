import type { IBrowser, ICPU, IDevice, IEngine, IOS, IResult, ParserExtensions } from '../src/index'
import { describe, expect, it } from 'vitest'
import {
  BROWSER,
  OS,
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

interface NavigatorMock {
  userAgent?: string
  brave?: { isBrave?: () => unknown }
  standalone?: unknown
  maxTouchPoints?: number
  userAgentData?: {
    mobile?: boolean
    platform?: string
  }
}

function withMockedNavigator<T>(navigator: NavigatorMock, run: () => T): T {
  const globalWithWindow = globalThis as { window?: unknown }
  const previousWindow = globalWithWindow.window
  globalWithWindow.window = { navigator }

  try {
    return run()
  }
  finally {
    if (typeof previousWindow === 'undefined')
      delete globalWithWindow.window
    else
      globalWithWindow.window = previousWindow
  }
}

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

describe('runtime navigator fallbacks', () => {
  it('uses runtime navigator user-agent when ua is omitted', () => {
    withMockedNavigator(
      { userAgent: 'CustomUA/1.0' },
      () => {
        expect(parseUA(undefined).ua).toBe('CustomUA/1.0')
      },
    )
  })

  it('falls back to empty ua when runtime navigator user-agent is missing', () => {
    withMockedNavigator(
      {},
      () => {
        expect(parseUA(undefined).ua).toBe('')
      },
    )
  })

  it('marks the browser as Brave when runtime brave API is available', () => {
    withMockedNavigator(
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        brave: { isBrave: () => true },
      },
      () => {
        expect(parseBrowser(undefined).name).toBe('Brave')
      },
    )
  })

  it('uses userAgentData.mobile as a device fallback in self navigator context', () => {
    withMockedNavigator(
      {
        userAgent: 'CustomDeviceAgent/1.0',
        userAgentData: { mobile: true },
      },
      () => {
        expect(parseDevice(undefined).type).toBe('mobile')
      },
    )
  })

  it('detects iPadOS from Macintosh UA with standalone and touch points', () => {
    withMockedNavigator(
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
        standalone: false,
        maxTouchPoints: 5,
      },
      () => {
        const device = parseDevice(undefined)
        expect(device.model).toBe('iPad')
        expect(device.type).toBe('tablet')
      },
    )
  })

  it('uses userAgentData.platform when os cannot be detected from ua', () => {
    withMockedNavigator(
      {
        userAgent: 'UnknownOSAgent/1.0',
        userAgentData: { platform: 'macOS' },
      },
      () => {
        expect(parseOS(undefined).name).toBe('Mac OS')
      },
    )
  })

  it('uses runtime navigator ua in extension-only parser mode', () => {
    withMockedNavigator(
      { userAgent: 'MyBrowser/8.9' },
      () => {
        const customBrowser = [[/(mybrowser)\/([\w.]+)/i], [BROWSER.NAME, BROWSER.VERSION, BROWSER.MAJOR]]
        const result = parseBrowser({ browser: customBrowser })
        expect(result.name).toBe('MyBrowser')
        expect(result.version).toBe('8.9')
      },
    )
  })
})

describe('regex mapper edge cases', () => {
  it('breaks out safely when an extension contains an empty regex slot', () => {
    const invalidMatcher = [[undefined as unknown as RegExp], [BROWSER.NAME]] as unknown as unknown[]
    expect(() => parseBrowser('Custom/1.0', { browser: invalidMatcher })).not.toThrow()
  })

  it('supports mapper arrays of length 4 and ignores unsupported lengths', () => {
    const customBrowser = [[/custom-browser/i], [
      [BROWSER.NAME, 'Custom Browser'],
      [BROWSER.VERSION, /x/g, '', (value: string) => value],
      [BROWSER.MAJOR, /x/g, '', (value: string) => value, 'ignored'],
    ]] as unknown as unknown[]
    const result = parseBrowser('custom-browser', { browser: customBrowser })
    expect(result.name).toBe('Custom Browser')
    expect(result.version).toBeUndefined()
  })

  it('maps unmatched old Safari build tokens to an undefined version', () => {
    const uaString = 'Mozilla/5.0 AppleWebKit/530.0 (KHTML, like Gecko) Safari/999.1'
    const result = parseBrowser(uaString)
    expect(result.name).toBe('Safari')
    expect(result.version).toBeUndefined()
  })

  it('handles map entries that return undefined from mapper functions', () => {
    const customOS = [[/custom-os\/([\w.]+)/i], [[OS.VERSION, () => undefined], [OS.NAME, 'CustomOS']]] as unknown as unknown[]
    const result = parseOS('custom-os/1.2.3', { os: customOS })
    expect(result.name).toBe('CustomOS')
    expect(result.version).toBeUndefined()
  })
})
