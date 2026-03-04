import { asc, isNotNull } from "drizzle-orm"
import { installations } from "../database/schema"
import type { H3Event } from 'h3'

export async function getProcurementPMs(event: H3Event) {
    const db = useDrizzle(event)

    const results = await db
        .select({ pm: installations.pm })
        .from(installations)
        .where(isNotNull(installations.pm))
        .groupBy(installations.pm)
        .orderBy(asc(installations.pm))
        .all()

    return results.map((row) => row.pm).filter(Boolean)
}