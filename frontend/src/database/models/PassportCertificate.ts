import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators'

export default class PassportCertificate extends Model {
  static table = 'passport_certificates'

  @text('book_name') bookName: string
  @field('completion_days') completionDays: number
  @text('date') date: string
}
