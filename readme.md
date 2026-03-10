# ua-parser-modern

Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data. Supports browser & node.js environment.

Forked from [`my-ua-parser`](https://github.com/mcollina/my-ua-parser), rewritten in TypeScript with functional API in ESM.

## Install

```sh
pnpm i ua-parser-modern
```

## Usage

```ts
import { parseUA } from 'ua-parser-modern'

const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
console.log(result.browser) // { name: 'Chrome', version: '113.0.0.0', major: '113' }
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
} from 'ua-parser-modern'

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
import { BROWSER, parseUA } from 'ua-parser-modern'

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
interface IResult {
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

## Credits

Forked from [`my-ua-parser`](https://github.com/mcollina/my-ua-parser) by Matteo Collina, which was a fork of [ua-parser-js](http://npm.im/ua-parser-js) by Faisal Salman.

## License

MIT License
