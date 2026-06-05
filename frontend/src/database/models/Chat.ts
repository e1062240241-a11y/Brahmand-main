import { Model } from '@nozbe/watermelondb'
import { text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Chat extends Model {
  static table = 'chats'

  @text('chat_id') chatId: string
  @text('sender_id') senderId: string
  @text('sender_name') senderName: string
  @text('content') content: string
  @text('message_type') messageType: string
  @date('created_at') createdAt: Date
  @date('updated_at') updatedAt: Date
}
