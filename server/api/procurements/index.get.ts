import { eq, and, desc, like } from 'drizzle-orm'
import { procurements } from '~~/server/database/schema'
import { useDrizzle } from '~~/server/utils/db'

export default eventHandler(async (event) => {
    const query = getQuery(event)
    const { pm, status, year, projectName } = query
    
    if (!pm || !status || !year) {
        return []
    }

    const db = useDrizzle(event)

    const conditions = [
        eq(procurements.pm, String(pm)),
        eq(procurements.status, String(status)), 
        eq(procurements.year, Number(year))
    ]

    if (projectName) {
        conditions.push(like(procurements.projectName, `%${String(projectName)}%`))
    }
    
    const result = await db.select()
        .from(procurements)
        .where(and(...conditions))
        .orderBy(desc(procurements.no))

    return result
})