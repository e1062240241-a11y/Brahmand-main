import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 4,
  tables: [
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
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
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
    })
  ]
})
