import { Model } from '@nozbe/watermelondb'
import { field, date, text } from '@nozbe/watermelondb/decorators'

export default class Community extends Model {
  static table = 'communities'

  @text('name') name: string
  @text('description') description?: string
  @text('photo') photo?: string
  @text('type') type: string
  @field('member_count') memberCount: number
  @date('created_at') created_at: number
  @date('updated_at') updated_at: number
}
