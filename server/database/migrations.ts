import { sql } from 'drizzle-orm'
import { useDrizzle } from '~~/server/utils/db'

export const runMigrations = async () => {
    const db = useDrizzle()
    console.log('Running migrations...')

    try {
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS dashboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                code TEXT UNIQUE,
                widgets TEXT,
                config TEXT,
                created_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
                updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000)
            )
        `)
        console.log('Migrations completed successfully.')
    } catch (error) {
        console.error('Migration failed:', error)
        throw error
    }
}