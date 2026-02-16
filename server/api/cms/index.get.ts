import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()
    const results = await db.select().from(dashboards).all()

    return {
        status: 200,
        data: results
    }
})