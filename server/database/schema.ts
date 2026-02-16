import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { WidgetData, Dashboard } from '~~/types/dashboard'

export const dashboards = sqliteTable('dashboards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name'),
    code: text('code').unique(),
    templates: text('templates', { mode: 'json' }).$type<WidgetData[]>(),
    config: text('config', { mode: 'json' }).$type<Dashboard['config']>(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
