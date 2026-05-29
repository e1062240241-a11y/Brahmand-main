import { Platform } from 'react-native';
import { of } from 'rxjs';

let database: any;

if (Platform.OS === 'web') {
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
