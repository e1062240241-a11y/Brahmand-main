import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

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

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'BrahmandLocalDB',
  jsi: false,
  onSetUpError: (error: any) => {
    console.error('[WatermelonDB] Database setup failed:', error)
  },
})

export const database = new Database({
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
    PassportCertificate
  ],
})
