import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

export async function getAllDashboards(event: H3Event) {
    const db = useDrizzle(event)
    return await db.select().from(dashboards).all()
}

export async function getDashboardById(event: H3Event, id: number) {
    const db = useDrizzle(event)
    const result = await db.select().from(dashboards).where(eq(dashboards.id, id)).get()
    
    if (!result) throw createError({ statusCode: 404, message: 'Dashboard not found' })
    return result
}

export async function updateDashboard(event: H3Event, id: number, data: any) {
    const db = useDrizzle(event)
    
    const { id: _id, createdAt, updatedAt, ...updatedData } = data

    const result = await db.update(dashboards)
        .set({ ...updatedData, updatedAt: new Date() })
        .where(eq(dashboards.id, id))
        .returning()
        .get()

    return result
}