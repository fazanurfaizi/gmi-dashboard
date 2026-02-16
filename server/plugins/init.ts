import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
import { runMigrations } from '../database/migrations'

const DEFAULT_DASHBOARD_CODE = 'default'

export default defineNitroPlugin(async () => {
    const db = useDrizzle()

    try {
        await runMigrations()
        
        const existing = await db.select().from(dashboards).where(
            eq(dashboards.code, DEFAULT_DASHBOARD_CODE)
        ).get()

        if (!existing) {
            console.log('Initializing default dashboard...')
            await db.insert(dashboards).values({
                name: 'General Dashboard',
                code: DEFAULT_DASHBOARD_CODE,
                templates: [],
                config: {
                    defaultDateFilter: 'thisWeek'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            })
            console.log('Default dashboard created.')
        }
    } catch (error) {
        console.error('Failed to initialize dashboard:', error)
    }
})