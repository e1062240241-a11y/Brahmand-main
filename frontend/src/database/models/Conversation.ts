import { Model } from '@nozbe/watermelondb'
import { field, date, text } from '@nozbe/watermelondb/decorators'

export default class Conversation extends Model {
  static table = 'conversations'

  @text('name') name: string
  @text('photo') photo?: string
  @text('last_message') lastMessage?: string
  @date('last_message_at') lastMessageAt?: Date
  @field('unread_count') unreadCount: number
  @text('type') type: string // 'dm' or 'circle'
  @text('sl_id') slId?: string // For DMs
  @text('other_user_id') otherUserId?: string // For DMs
  @field('member_count') memberCount?: number // For circles
  @date('updated_at') updatedAt: Date
}
