run `npm run test && npm run debug && npm run lint` 
and fix errors until all tests work, no errors, and no linters

package.json
"test": "vitest",
"debug": "tsc --noEmit -p tsconfig.app.json",
"lint": "eslint .",
