import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    const result = await db.select().from(dashboards).where(eq(dashboards.id, 1)).get()

    if (!result) throw createError({ statusCode: 404, message: 'Dashboard not found' })

    let sortedWidgets = result.widgets || []

    if (sortedWidgets.length > 0) {
        sortedWidgets.sort((a: any, b: any) => {
            const aY = a.y || 0
            const bY = b.y || 0
            const aX = a.x || 0
            const bX = b.x || 0

            if (aY !== bY) return aY - bY

            return aX - bX
        })

        sortedWidgets = sortedWidgets.map((widget) => ({
            ...widget,
            loading: true
        }))
    }

    let renderCols: any[] = []    

    return {
        status: 200,
        data: {
            ...result,
            widgets: sortedWidgets,
            renderCols: renderCols
        }
    }
})