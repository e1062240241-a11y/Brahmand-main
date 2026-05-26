// Web fallback for WatermelonDB to prevent SQLite/Node.js dependencies on the web
// This provides a dummy database object to satisfy imports on the web.

class DummyCollection {
  query() { return { fetch: async () => [], observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) } }
  find() { return Promise.resolve(null) }
}

export const database = {
  collections: {
    get: (name: string) => new DummyCollection()
  },
  action: async (fn: () => Promise<any>) => {
    return await fn();
  },
  batch: async (...args: any[]) => {},
  write: async (fn: () => Promise<any>) => {
    return await fn();
  }
} as any;
