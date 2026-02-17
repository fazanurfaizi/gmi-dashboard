import { useDrizzle } from '~~/server/utils/db'
import { dashboards } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()
    const body = await readBody(event)

    // if (!id) throw createError({ statusCode: 400, message: 'Invalid ID' })

    console.log(body)

    // const result = await db.update(dashboards)
    //     .set({
    //         ...updatedData,
    //         updatedAt: new Date()
    //     })
    //     .where(eq(dashboards.id, id))
    //     .returning()
    //     .get()

    return {
        status: 200,
        data: null
    }
})