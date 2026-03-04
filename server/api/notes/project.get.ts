import { eq, and, desc } from 'drizzle-orm'
import { notes } from '~~/server/database/schema'
import { useDrizzle } from '~~/server/utils/db'

export default eventHandler(async (event) => {
    const query = getQuery(event)
    const { pm, projectName, year } = query
    
    if (!pm || !projectName || !year) {
        return []
    }

    const db = useDrizzle(event)
    
    const result = await db.select()
        .from(notes)
        .where(
            and(
                eq(notes.pm, String(pm)),
                eq(notes.project_name, String(projectName)),
                eq(notes.year, Number(year))
            )
        )
        .orderBy(desc(notes.noteDate))

    return result
})