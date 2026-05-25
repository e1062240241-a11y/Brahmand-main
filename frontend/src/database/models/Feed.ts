import { Model } from '@nozbe/watermelondb'
import { text, field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Feed extends Model {
  static table = 'feeds'

  @text('user_id') userId: string
  @text('username') username: string
  @text('user_photo') userPhoto?: string
  @text('media_url') mediaUrl?: string
  @text('media_type') mediaType: string
  @text('caption') caption?: string
  @field('likes_count') likesCount: number
  @field('comments_count') commentsCount: number
  @field('liked_by_me') likedByMe: boolean
  @readonly @date('created_at') createdAt: Date
  @readonly @date('updated_at') updatedAt: Date
}
