// Web fallback for WatermelonDB to prevent SQLite/Node.js dependencies on the web
// This provides a dummy database object to satisfy imports on the web.
import { of } from 'rxjs';

class DummyCollection {
  query() { 
    return { 
      fetch: async () => [], 
      observe: () => of([]) 
    };
  }
  find() { return Promise.resolve(null) }
  create(fn: (record: any) => void) { return Promise.resolve({ update: async () => {} }) }
  update(record: any, fn: (record: any) => void) { return Promise.resolve({}) }
}

export const database = {
  get: (name: string) => new DummyCollection(),
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
