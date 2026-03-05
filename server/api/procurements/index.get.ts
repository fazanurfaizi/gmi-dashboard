import { eq, and, desc } from 'drizzle-orm'
import { procurements } from '~~/server/database/schema'
import { useDrizzle } from '~~/server/utils/db'

export default eventHandler(async (event) => {
    const query = getQuery(event)
    const { pm, status, year } = query
    
    if (!pm || !status || !year) {
        return []
    }

    const db = useDrizzle(event)
    
    const result = await db.select()
        .from(procurements)
        .where(
            and(
                eq(procurements.pm, String(pm)),
                eq(procurements.status, String(status)), 
                eq(procurements.year, Number(year))
            )
        )
        .orderBy(desc(procurements.no))

    return result
})