import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 8,
      steps: [
        createTable({
          name: 'temples',
          columns: [
            { name: 'temple_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'location', type: 'string', isOptional: true },
            { name: 'deity', type: 'string', isOptional: true },
            { name: 'category', type: 'string', isOptional: true },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'guidance', type: 'string', isOptional: true },
            { name: 'image_url', type: 'string', isOptional: true },
            { name: 'youtube_url', type: 'string', isOptional: true },
            { name: 'coords', type: 'string', isOptional: true },
            { name: 'aarti_timings', type: 'string', isOptional: true },
            { name: 'is_following', type: 'boolean', isOptional: true },
            { name: 'is_verified', type: 'boolean', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ]
        }),
      ]
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: 'conversations',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'photo', type: 'string', isOptional: true },
            { name: 'last_message', type: 'string', isOptional: true },
            { name: 'last_message_at', type: 'number', isOptional: true },
            { name: 'unread_count', type: 'number' },
            { name: 'type', type: 'string' },
            { name: 'sl_id', type: 'string', isOptional: true },
            { name: 'other_user_id', type: 'string', isOptional: true },
            { name: 'member_count', type: 'number', isOptional: true },
            { name: 'updated_at', type: 'number' },
          ]
        }),
        createTable({
          name: 'library_progress',
          columns: [
            { name: 'book_id', type: 'string', isIndexed: true },
            { name: 'chapter_name', type: 'string' },
            { name: 'chapter_num', type: 'number' },
            { name: 'last_read_page', type: 'number' },
            { name: 'total_pages', type: 'number' },
            { name: 'progress_percent', type: 'number' },
            { name: 'last_opened_time', type: 'number' },
          ]
        }),
        createTable({
          name: 'passport_journeys',
          columns: [
            { name: 'location', type: 'string' },
            { name: 'date', type: 'string' },
            { name: 'story', type: 'string' },
            { name: 'answers', type: 'string' },
            { name: 'created_at', type: 'number' },
          ]
        }),
        createTable({
          name: 'passport_badges',
          columns: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'earned_at', type: 'string' },
            { name: 'count', type: 'number' },
          ]
        }),
        createTable({
          name: 'passport_certificates',
          columns: [
            { name: 'book_name', type: 'string' },
            { name: 'completion_days', type: 'number' },
            { name: 'date', type: 'string' },
          ]
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        // Dummy version 6 migration to satisfy the range (5 -> 6 -> 7)
      ],
    },
    {
      toVersion: 5,
      steps: [
        createTable({
          name: 'sync_queue',
          columns: [
            { name: 'url', type: 'string' },
            { name: 'method', type: 'string' },
            { name: 'payload', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
})
