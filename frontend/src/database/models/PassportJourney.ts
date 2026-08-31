import { Model } from '@nozbe/watermelondb'
import { text, date, readonly } from '@nozbe/watermelondb/decorators'

export default class PassportJourney extends Model {
  static table = 'passport_journeys'

  @text('location') location: string
  @text('date') date: string
  @text('story') story: string
  @text('answers') rawAnswers: string
  @readonly @date('created_at') createdAt: Date

  // Getter for generated_story (for backward compatibility/consistency)
  get generated_story(): string {
    return this.story || '';
  }

  // Getter for answers (parses rawAnswers JSON string)
  get answers(): any[] {
    try {
      const parsed = JSON.parse(this.rawAnswers);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return parsed.answersList || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  // Getter for title (extracts from answers JSON, defaults if not present)
  get title(): string {
    try {
      const parsed = JSON.parse(this.rawAnswers);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed.title || 'My Spiritual Journey';
      }
      return 'My Spiritual Journey';
    } catch {
      return 'My Spiritual Journey';
    }
  }

  // Getter for media (extracts from answers JSON, defaults if not present)
  get media(): any[] {
    try {
      const parsed = JSON.parse(this.rawAnswers);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed.media || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  // Getter for visibility (extracts from answers JSON, defaults if not present)
  get visibility(): string {
    try {
      const parsed = JSON.parse(this.rawAnswers);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed.visibility || 'private';
      }
      return 'private';
    } catch {
      return 'private';
    }
  }
}

