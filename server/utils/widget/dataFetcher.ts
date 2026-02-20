import { eq, desc, asc, like, gte, lte } from 'drizzle-orm'
import { useDrizzle } from '~~/server/utils/db'
import { installations, procurements } from '~~/server/database/schema'

export async function fetchAndAggregateWidgetData(config: any) {
    if (!config.dataSource) throw createError({ statusCode: 400, message: "No data source specified." })
    
    const db = useDrizzle()

    let targetTable: any
    if (config.dataSource === 'procurements') targetTable = procurements
    else if (config.dataSource === 'installations') targetTable = installations
    else throw createError({ statusCode: 400, message: `Unknown data source: ${config.dataSource}` })

    let qb: any = db.select().from(targetTable)

    const rawRows = await qb

    if (!config.columns || config.columns.length === 0) return rawRows

    const groupCols = config.columns.filter((col: any) => !col.aggregation)
    const aggCols = config.columns.filter((col: any) => !!col.aggregation)

    if (aggCols.length === 0) {
        return rawRows.map((r: any) => {
            const row: any = {}
            config.columns.forEach((col: any) => {
                row[col.name] = r[col.name]
            })
            return row
        })
    }

    const grouped: Record<string, any[]> = {}
    rawRows.forEach((r: any) => {
        const key = groupCols.map((c: any) => String(r[c.name])).join('|||')
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(r)
    })

    const result: any[] = []

    for (const [keyStr, items] of Object.entries(grouped)) {
        const row: any = {}
        const keyParts = keyStr.split('|||')

        groupCols.forEach((c: any, index: number) => {
            const val = keyParts[index]
            row[c.name] = !isNaN(Number(val)) && val !== '' ? Number(val) : val
        })

        aggCols.forEach((c: any) => {
            const agg = String(c.aggregation).toLowerCase()
            
            if (agg === "count") {
                row[c.name] = items.length
                return
            }

            const values = items.map(r => Number(r[c.name])).filter(v => !isNaN(v))
            if (values.length === 0) {
                row[c.name] = null
                return
            }

            switch (agg) {
                case 'sum': 
                    row[c.name] = values.reduce((a, b) => a + b, 0) 
                    break
                case 'avg': 
                    row[c.name] = values.reduce((a, b) => a + b, 0) / values.length 
                    break
                case 'min': 
                    row[c.name] = Math.min(...values) 
                    break
                case 'max': 
                    row[c.name] = Math.max(...values) 
                    break
                default: 
                row[c.name] = null
            }
        })

        result.push(row)
    }

    return result
}