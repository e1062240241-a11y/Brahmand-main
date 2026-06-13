import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 8,
  tables: [
    tableSchema({
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
        { name: 'coords', type: 'string', isOptional: true }, // stringified JSON {lat, lng}
        { name: 'aarti_timings', type: 'string', isOptional: true }, // stringified JSON
        { name: 'is_following', type: 'boolean', isOptional: true },
        { name: 'is_verified', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'sl_id', type: 'string' },
        { name: 'photo', type: 'string', isOptional: true },
        { name: 'bio', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'feeds',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'username', type: 'string' },
        { name: 'user_photo', type: 'string', isOptional: true },
        { name: 'media_url', type: 'string', isOptional: true },
        { name: 'media_type', type: 'string' },
        { name: 'caption', type: 'string', isOptional: true },
        { name: 'likes_count', type: 'number' },
        { name: 'comments_count', type: 'number' },
        { name: 'liked_by_me', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'chat_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string' },
        { name: 'sender_name', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'message_type', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'community_messages',
      columns: [
        { name: 'community_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string' },
        { name: 'sender_name', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'message_type', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'follows',
      columns: [
        { name: 'follower_id', type: 'string', isIndexed: true },
        { name: 'following_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'communities',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'photo', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'member_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
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
    tableSchema({
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
    tableSchema({
      name: 'passport_journeys',
      columns: [
        { name: 'location', type: 'string' },
        { name: 'date', type: 'string' },
        { name: 'story', type: 'string' },
        { name: 'answers', type: 'string' }, // stringified JSON
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'passport_badges',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'earned_at', type: 'string' },
        { name: 'count', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'passport_certificates',
      columns: [
        { name: 'book_name', type: 'string' },
        { name: 'completion_days', type: 'number' },
        { name: 'date', type: 'string' },
      ]
    }),
    tableSchema({
      name: 'vendors',
      columns: [
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'owner_id', type: 'string' },
        { name: 'business_name', type: 'string' },
        { name: 'owner_name', type: 'string' },
        { name: 'years_in_business', type: 'number' },
        { name: 'categories', type: 'string' },
        { name: 'full_address', type: 'string' },
        { name: 'location_link', type: 'string', isOptional: true },
        { name: 'phone_number', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'photos', type: 'string' },
        { name: 'business_description', type: 'string', isOptional: true },
        { name: 'business_gallery_images', type: 'string', isOptional: true },
        { name: 'menu_items', type: 'string', isOptional: true },
        { name: 'offers_home_delivery', type: 'boolean', isOptional: true },
        { name: 'offers_cash_on_delivery', type: 'boolean', isOptional: true },
        { name: 'business_hours', type: 'string', isOptional: true },
        { name: 'offers', type: 'string', isOptional: true },
        { name: 'kyc_status', type: 'string', isOptional: true },
        { name: 'distance', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'url', type: 'string' },
        { name: 'method', type: 'string' },
        { name: 'payload', type: 'string' },
        { name: 'created_at', type: 'number' },
      ]
    })
  ]
})
