import { Model } from '@nozbe/watermelondb'
import { text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class SyncQueue extends Model {
  static table = 'sync_queue'

  @text('url') url: string
  @text('method') method: string
  @text('payload') payload: string
  @readonly @date('created_at') createdAt: Date
}
