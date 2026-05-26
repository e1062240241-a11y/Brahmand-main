import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class CommunityMessage extends Model {
  static table = 'community_messages'

  @field('community_id') community_id: string
  @field('sender_id') sender_id: string
  @field('sender_name') sender_name: string
  @field('content') content: string
  @field('message_type') message_type: string
  @date('created_at') created_at: number
  @date('updated_at') updated_at: number
}
