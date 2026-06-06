import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators'

export default class LibraryProgress extends Model {
  static table = 'library_progress'

  @text('book_id') bookId: string
  @text('chapter_name') chapterName: string
  @field('chapter_num') chapterNum: number
  @field('last_read_page') lastReadPage: number
  @field('total_pages') totalPages: number
  @field('progress_percent') progressPercent: number
  @field('last_opened_time') lastOpenedTime: number
}
