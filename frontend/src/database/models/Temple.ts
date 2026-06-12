import { Model } from '@nozbe/watermelondb'
import { text, field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Temple extends Model {
  static table = 'temples'

  @text('temple_id') templeId: string
  @text('name') name: string
  @text('location') location?: string
  @text('deity') deity?: string
  @text('category') category?: string
  @text('description') description?: string
  @text('guidance') guidance?: string
  @text('image_url') imageUrl?: string
  @text('youtube_url') youtubeUrl?: string
  @text('coords') coords?: string // stringified JSON
  @text('aarti_timings') aartiTimings?: string // stringified JSON
  @field('is_following') isFollowing?: boolean
  @field('is_verified') isVerified?: boolean
  @readonly @date('created_at') createdAt: Date
  @readonly @date('updated_at') updatedAt: Date
}
