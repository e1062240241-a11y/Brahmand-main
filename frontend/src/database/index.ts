import { Platform } from 'react-native';
import { of } from 'rxjs';

let database: any;

if (Platform.OS === 'web') {
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

  database = {
    get: (name: string) => new DummyCollection(),
    collections: {
      get: (name: string) => new DummyCollection()
    },
    action: async (fn: () => Promise<any>) => await fn(),
    batch: async (...args: any[]) => {},
    write: async (fn: () => Promise<any>) => await fn()
  };
} else {
  database = require('./index.native').database;
}

export { database };
