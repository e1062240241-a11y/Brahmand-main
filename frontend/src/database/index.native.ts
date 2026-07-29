import { NativeModules } from 'react-native'
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { of } from 'rxjs'

import schema from './schema'
import migrations from './migrations'
import User from './models/User'
import Feed from './models/Feed'
import Chat from './models/Chat'
import CommunityMessage from './models/CommunityMessage'
import Follow from './models/Follow'
import Community from './models/Community'
import Vendor from './models/Vendor'
import SyncQueue from './models/SyncQueue'
import Conversation from './models/Conversation'
import LibraryProgress from './models/LibraryProgress'
import PassportJourney from './models/PassportJourney'
import PassportBadge from './models/PassportBadge'
import PassportCertificate from './models/PassportCertificate'
import Temple from './models/Temple'

class DummyRecord {
  constructor(data: any = {}) {
    Object.assign(this, data)
  }
  prepareUpdate(fn: (record: any) => void) {
    fn(this)
    return this
  }
  update(fn: (record: any) => void) {
    fn(this)
    return Promise.resolve(this)
  }
}

class DummyCollection {
  query() {
    return {
      fetch: async () => [],
      observe: () => of([]),
    }
  }
  find() { return Promise.resolve(null) }
  create(fn: (record: any) => void) {
    const record = new DummyRecord()
    fn(record)
    return Promise.resolve(record)
  }
  prepareCreate(fn: (record: any) => void) {
    const record = new DummyRecord()
    fn(record)
    return record
  }
  update(record: any, fn: (record: any) => void) {
    fn(record)
    return Promise.resolve(record)
  }
}

const createFallbackDatabase = () => ({
  get: (name: string) => new DummyCollection(),
  collections: {
    get: (name: string) => new DummyCollection(),
  },
  action: async (fn: () => Promise<any>) => await fn(),
  batch: async (...args: any[]) => {},
  write: async (fn: () => Promise<any>) => await fn(),
} as any)

let databaseInstance: any

if (NativeModules.WMDatabaseBridge) {
  try {
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: 'BrahmandLocalDB',
      jsi: false,
      onSetUpError: (error: any) => {
        console.error('[WatermelonDB] Database setup failed:', error)
      },
    })

    databaseInstance = new Database({
      adapter,
      modelClasses: [
        User,
        Feed,
        Chat,
        CommunityMessage,
        Follow,
        Community,
        Vendor,
        SyncQueue,
        Conversation,
        LibraryProgress,
        PassportJourney,
        PassportBadge,
        PassportCertificate,
        Temple,
      ],
    })
  } catch (error) {
    console.warn('[WatermelonDB] WMDatabaseBridge available but SQLiteAdapter initialization failed, using fallback database:', error)
    databaseInstance = createFallbackDatabase()
  }
} else {
  console.warn('[WatermelonDB] NativeModules.WMDatabaseBridge is undefined in current native build. Using fallback in-memory database until app is rebuilt with npx expo run:android.')
  databaseInstance = createFallbackDatabase()
}

export const database = databaseInstance
