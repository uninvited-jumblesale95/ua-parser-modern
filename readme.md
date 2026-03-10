# ua-parser-es

JavaScript/TypeScript library to detect browser, engine, OS, CPU, and device information from User-Agent strings.

## Install

```sh
npm i ua-parser-es
```

## Usage

```ts
import { parseUA } from 'ua-parser-es'

const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
console.log(result.browser)
```

### Named parser functions

```ts
import {
  parseBrowser,
  parseCPU,
  parseDevice,
  parseEngine,
  parseOS,
  parseUA,
} from 'ua-parser-es'

const ua = 'Mozilla/5.0 (...)'

parseBrowser(ua)
parseCPU(ua)
parseDevice(ua)
parseEngine(ua)
parseOS(ua)
parseUA(ua)
```

### Extend regexes

```ts
import { BROWSER, parseUA } from 'ua-parser-es'

const customBrowser = [
  [/(mybrowser)\/([\w.]+)/i],
  [BROWSER.NAME, BROWSER.VERSION],
]

const result = parseUA('Mozilla/5.0 MyBrowser/1.3', {
  browser: customBrowser,
})
```

## API

### `parseUA(uastring?, extensions?)`

Returns:

```ts
type IResult = {
  ua: string
  browser: { name?: string, version?: string, major?: string }
  cpu: { architecture?: string }
  device: { model?: string, type?: string, vendor?: string }
  engine: { name?: string, version?: string }
  os: { name?: string, version?: string }
}
```

### `parseBrowser(uastring?, extensions?)`

Returns `{ name, version, major }`.

### `parseCPU(uastring?, extensions?)`

Returns `{ architecture }`.

### `parseDevice(uastring?, extensions?)`

Returns `{ model, type, vendor }`.

### `parseEngine(uastring?, extensions?)`

Returns `{ name, version }`.

### `parseOS(uastring?, extensions?)`

Returns `{ name, version }`.

### Exported constants

- `BROWSER`
- `CPU`
- `DEVICE`
- `ENGINE`
- `OS`
- `version`

## Notes

- The package is pure ESM.
- `parseUA` is a named export.
- Browser-specific enhancements (Brave/iPadOS/client hints) are applied when parsing the current runtime navigator UA.

## Credits

This library is a fork of [ua-parser-js](http://npm.im/ua-parser-js) by Faisal Salman.

Fork point:
- https://github.com/faisalman/ua-parser-js/commit/693a83de2e4cf8384f43f6a5831e58663c572580

## License

MIT License
