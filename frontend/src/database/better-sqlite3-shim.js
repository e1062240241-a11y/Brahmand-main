// Shim for better-sqlite3 — this Node.js-only module is referenced by
// WatermelonDB's SQLite adapter internals but is never actually used
// in React Native / Expo.  Providing an empty shim prevents Metro from
// crashing during bundle resolution.
module.exports = {};
