import { Model } from '@nozbe/watermelondb'
import { field, text, date } from '@nozbe/watermelondb/decorators'

export default class PassportJourney extends Model {
  static table = 'passport_journeys'

  @text('location') location: string
  @text('date') date: string
  @text('story') story: string
  @text('answers') answers: string // JSON string
  @date('created_at') createdAt: number
}
