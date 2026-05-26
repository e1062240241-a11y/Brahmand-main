import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Follow extends Model {
  static table = 'follows'

  @field('follower_id') follower_id: string
  @field('following_id') following_id: string
  @date('created_at') created_at: number
  @date('updated_at') updated_at: number
}
