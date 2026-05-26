import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Community extends Model {
  static table = 'communities'

  @field('name') name: string
  @field('description') description?: string
  @field('photo') photo?: string
  @date('created_at') created_at: number
  @date('updated_at') updated_at: number
}
