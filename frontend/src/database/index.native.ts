import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import User from './models/User'
import Feed from './models/Feed'
import Chat from './models/Chat'
import CommunityMessage from './models/CommunityMessage'
import Follow from './models/Follow'
import Community from './models/Community'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'BrahmandLocalDB',
  jsi: false,
  onSetUpError: (error: any) => {
    console.error('[WatermelonDB] Database setup failed:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [User, Feed, Chat, CommunityMessage, Follow, Community],
})
