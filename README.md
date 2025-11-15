# js-to-ts-converter

Convert JavaScript files to TypeScript with intelligent type annotations.

## Installation

```bash
npm install -g js-to-ts-converter
```

## Usage

### CLI

```bash
js2ts input.js
```

### Programmatic API

```typescript
import { convertFile, convertCode } from 'js-to-ts-converter';

// Convert a file
const result = await convertFile('input.js');

// Convert code string
const result = await convertCode('const x = 5;');
```

## Configuration

Create a `.js2tsrc.json` file in your project root:

```json
{
  "strict": true,
  "preferInterfaces": true,
  "targetTSVersion": "5.0",
  "aiMode": false
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test
```

## License

MIT
