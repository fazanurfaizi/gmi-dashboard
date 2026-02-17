import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
import { buildColumnLayout } from '~~/server/utils/layout'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    const result = await db.select().from(dashboards).where(eq(dashboards.id, 1)).get()

    if (!result) throw createError({ statusCode: 404, message: 'Dashboard not found' })

    let renderCols: any[] = []
    
    if (result.widgets && Array.isArray(result.widgets)) {
        renderCols = buildColumnLayout(result.widgets)
    }

    return {
        status: 200,
        data: {
            ...result,
            renderCols: renderCols
        }
    }
})