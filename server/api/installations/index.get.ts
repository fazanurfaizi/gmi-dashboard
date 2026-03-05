import { eq, and, desc } from 'drizzle-orm'
import { installations } from '~~/server/database/schema'
import { useDrizzle } from '~~/server/utils/db'

export default eventHandler(async (event) => {
    const query = getQuery(event)
    const { pm, status, year } = query
    
    if (!pm || !status || !year) {
        return []
    }

    const db = useDrizzle(event)
    
    const result = await db.select()
        .from(installations)
        .where(
            and(
                eq(installations.pm, String(pm)),
                eq(installations.status, String(status)), 
                eq(installations.year, Number(year))
            )
        )
        .orderBy(desc(installations.no))

    return result
})