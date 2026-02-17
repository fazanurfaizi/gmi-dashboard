import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { WidgetData } from '~~/types/dashboard'

export const dashboards = sqliteTable('dashboards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name'),
    code: text('code').unique(),
    widgets: text('widgets', { mode: 'json' }).$type<WidgetData[]>(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
