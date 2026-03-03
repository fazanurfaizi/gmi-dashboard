import { asc, isNotNull } from "drizzle-orm"
import { installations } from "../database/schema"

export async function getProcurementPMs() {
    const db = useDrizzle()

    const results = await db
        .select({ pm: installations.pm })
        .from(installations)
        .where(isNotNull(installations.pm))
        .groupBy(installations.pm)
        .orderBy(asc(installations.pm))
        .all()

    console.log(results)

    return results.map((row) => row.pm).filter(Boolean)
}