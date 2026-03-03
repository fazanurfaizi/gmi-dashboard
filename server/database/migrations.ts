import { sql } from 'drizzle-orm'
import { useDrizzle } from '~~/server/utils/db'

export const runMigrations = async () => {
    const db = useDrizzle()
    console.log('Running migrations...')

    try {
        // 1. Dashboards Table
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS dashboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                code TEXT UNIQUE,
                widgets TEXT,
                config TEXT,
                created_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
                updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000)
            );
        `)

        // 2. Dashboards Index
        await db.run(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS dashboards_code_unique ON dashboards (code);
        `)

        // 3. Installations Table
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS installations (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                year integer NOT NULL,
                status text,
                no integer,
                bast_and_retention_date text,
                bast_document_date text,
                project_code text,
                project_name text,
                location text,
                capacity real,
                unit text,
                pm text,
                admin text,
                sm text,
                plan_oh integer,
                actual_oh integer,
                manpower_update integer,
                epc text,
                developer text,
                roof_type text,
                progress_data text,
                synced_at integer
            );
        `)

        // 4. Procurements Table
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS procurements (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                year integer NOT NULL,
                status text,
                no integer,
                project_code text,
                project_name text,
                location text,
                pm text,
                admin text,
                epc text,
                notes text,
                synced_at integer
            );
        `)

        await db.run(sql`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                note_date INTEGER,
                pm TEXT NOT NULL,
                project_name TEXT,
                notes TEXT,
                year INTEGER NOT NULL,
                synced_at INTEGER
            );
        `)

        console.log('Migrations completed successfully.')
    } catch (error) {
        console.error('Migration failed:', error)
        throw error
    }
}