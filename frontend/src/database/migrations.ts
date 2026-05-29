import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
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
