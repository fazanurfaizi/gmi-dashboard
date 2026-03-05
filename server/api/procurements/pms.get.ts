import { asc, isNotNull } from 'drizzle-orm'
import { installations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
    try {
        const db = useDrizzle(event)
        
        const results = await db
            .select({ pm: installations.pm })
            .from(installations)
            .where(isNotNull(installations.pm))
            .groupBy(installations.pm)
            .orderBy(asc(installations.pm))
            .all()
    
        const pms= results.map((row) => row.pm).filter(Boolean)
        
        return {
            status: 200,
            data: pms
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch PMs'
        })
    }
})