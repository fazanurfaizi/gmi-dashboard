import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()
    const id = Number(event.context.params?.id)

    if (!id) throw createError({ statusCode: 400, message: 'Invalid ID' })

    const result = await db.select().from(dashboards).where(eq(dashboards.id, id)).get()

    if (!result) throw createError({ statusCode: 404, message: 'Dashboard not found' })

    return {
        status: 200,
        data: result
    }
})