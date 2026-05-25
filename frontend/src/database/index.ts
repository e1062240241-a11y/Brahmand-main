// Default fallback — identical to index.native.ts.
// Metro resolves index.native.ts for iOS/Android and index.web.ts for web,
// so this file is only reached by non-platform tooling (e.g. tsc, tests).
export { database } from './index.native'
