// Web fallback for WatermelonDB to prevent SQLite/Node.js dependencies on the web
// This provides a dummy database object to satisfy imports on the web.
import { of } from 'rxjs';

class DummyRecord {
  constructor(data: any = {}) {
    Object.assign(this, data);
  }
  prepareUpdate(fn: (record: any) => void) {
    fn(this);
    return this;
  }
  update(fn: (record: any) => void) {
    fn(this);
    return Promise.resolve(this);
  }
}

class DummyCollection {
  query() { 
    return { 
      fetch: async () => [], 
      observe: () => of([]) 
    };
  }
  find() { return Promise.resolve(null) }
  create(fn: (record: any) => void) {
    const record = new DummyRecord();
    fn(record);
    return Promise.resolve(record);
  }
  prepareCreate(fn: (record: any) => void) {
    const record = new DummyRecord();
    fn(record);
    return record;
  }
  update(record: any, fn: (record: any) => void) {
    fn(record);
    return Promise.resolve(record);
  }
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
