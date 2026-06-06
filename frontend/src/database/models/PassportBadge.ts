import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators'

export default class PassportBadge extends Model {
  static table = 'passport_badges'

  @text('title') title: string
  @text('description') description: string
  @text('earned_at') earnedAt: string
  @field('count') count: number
}
