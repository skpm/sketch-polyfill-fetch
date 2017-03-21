# sketch-module-fetch-polyfill

A [fetch](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) polyfill for sketch inspired by [unfetch](https://github.com/developit/unfetch).

## Installation

```bash
npm i -S sketch-module-fetch-polyfill
```

## Usage

```js
import fetch from 'sketch-module-fetch-polyfill'

fetch("https://google.com")
  .then(response => response.text())
  .then(text => console.log(text))
  .catch(e => console.error(e))
```
