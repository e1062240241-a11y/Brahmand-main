import { Model } from '@nozbe/watermelondb'
import { text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  static table = 'users'

  @text('name') name: string
  @text('sl_id') slId: string
  @text('photo') photo?: string
  @text('bio') bio?: string
  @text('public_key') publicKey?: string
  @readonly @date('created_at') createdAt: Date
  @readonly @date('updated_at') updatedAt: Date
}
