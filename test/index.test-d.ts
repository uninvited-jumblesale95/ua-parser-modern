import type { BROWSER, CPU, DEVICE, ENGINE, IBrowser, ICPU, IDevice, IEngine, IOS, IResult, OS } from '../src/index'
import { expectTypeOf, test } from 'vitest'
import {

  BROWSER as BROWSER_CONST,

  CPU as CPU_CONST,

  DEVICE as DEVICE_CONST,

  ENGINE as ENGINE_CONST,

  OS as OS_CONST,
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
  parseUA,
  version,
} from '../src/index'

const ua = 'Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6'
const result = parseUA(ua)

test('parseUA signatures', () => {
  expectTypeOf(parseUA()).toEqualTypeOf<IResult>()
  expectTypeOf(parseUA(ua)).toEqualTypeOf<IResult>()
})

test('functional parser methods', () => {
  expectTypeOf(parseBrowser(ua)).toEqualTypeOf<IBrowser>()
  expectTypeOf(parseCPU(ua)).toEqualTypeOf<ICPU>()
  expectTypeOf(parseDevice(ua)).toEqualTypeOf<IDevice>()
  expectTypeOf(parseEngine(ua)).toEqualTypeOf<IEngine>()
  expectTypeOf(parseOS(ua)).toEqualTypeOf<IOS>()

  expectTypeOf(result).toEqualTypeOf<IResult>()
  expectTypeOf(result.ua).toEqualTypeOf<string>()
})

test('extensions argument support', () => {
  const ownBrowser = [[/(ownbrowser)\/([\w.]+)/i], [BROWSER_CONST.NAME, BROWSER_CONST.VERSION]]

  expectTypeOf(parseUA({ browser: ownBrowser })).toEqualTypeOf<IResult>()
  expectTypeOf(parseUA(ua, { browser: ownBrowser })).toEqualTypeOf<IResult>()

  expectTypeOf(parseBrowser({ browser: ownBrowser })).toEqualTypeOf<IBrowser>()
  expectTypeOf(parseBrowser(ua, { browser: ownBrowser })).toEqualTypeOf<IBrowser>()
})

test('exported constants', () => {
  expectTypeOf(BROWSER_CONST).toEqualTypeOf<BROWSER>()
  expectTypeOf(CPU_CONST).toEqualTypeOf<CPU>()
  expectTypeOf(DEVICE_CONST).toEqualTypeOf<DEVICE>()
  expectTypeOf(ENGINE_CONST).toEqualTypeOf<ENGINE>()
  expectTypeOf(OS_CONST).toEqualTypeOf<OS>()
  expectTypeOf(version).toEqualTypeOf<string>()
})
