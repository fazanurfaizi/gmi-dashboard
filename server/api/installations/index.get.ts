import { eq, and, desc, like } from 'drizzle-orm'
import { installations } from '~~/server/database/schema'
import { useDrizzle } from '~~/server/utils/db'

export default eventHandler(async (event) => {
    const query = getQuery(event)
    const { pm, status, year, projectName } = query
    
    if (!pm || !status || !year) {
        return []
    }

    const db = useDrizzle(event)

    const conditions = [
        eq(installations.pm, String(pm)),
        eq(installations.status, String(status)), 
        eq(installations.year, Number(year))
    ]

    if (projectName) {        
        conditions.push(like(installations.projectName, `%${String(projectName)}%`))
    }
    
    const result = await db.select()
        .from(installations)
        .where(and(...conditions))
        .orderBy(desc(installations.no))

    return result
})