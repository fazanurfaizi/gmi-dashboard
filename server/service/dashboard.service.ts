import { eq, desc, asc, like, gte, lte, ne, gt, lt, and } from 'drizzle-orm'
import { installations, notes, procurements } from '~~/server/database/schema'
import { ColumnConfig, ComparisonOperator, DataRow, WidgetData } from '~~/types/dashboard'
import { getDashboardById } from './cms.service'
import type { H3Event } from 'h3'

type DrizzleRow = Record<string, unknown>

export async function getClientDashboard(event: H3Event, id: number = 1) {
    const result = await getDashboardById(event, id)

    let sortedWidgets = result.widgets || []

    if (sortedWidgets.length > 0) {
        sortedWidgets.sort((a: any, b: any) => {
            const aY = a.y || 0
            const bY = b.y || 0
            const aX = a.x || 0
            const bX = b.x || 0
            if (aY !== bY) return aY - bY
            return aX - bX
        })

        // Inject initial state for the frontend
        sortedWidgets = sortedWidgets.map((widget: any) => ({
            ...widget,
            loading: true
        }))
    }

    return {
        ...result,
        widgets: sortedWidgets,
        renderCols: []
    }
}

export async function fetchAndAggregateWidgetData(event: H3Event, config: WidgetData['config'], widgetType: string): Promise<DataRow[]> {
    if (!config.dataSource || config.dataSource.length === 0) {
        throw createError({ statusCode: 400, message: "No data source specified." })
    }

    const db = useDrizzle(event)

    const dataSources = Array.isArray(config.dataSource) ? config.dataSource : [config.dataSource]
    if (widgetType === 'table' && !dataSources.includes('notes')) {
        dataSources.push('notes')
    }

    let allRawRows: DrizzleRow[] = []

    for (const source of dataSources) {
        let targetTable: any
        if (source === 'procurements') targetTable = procurements
        else if (source === 'installations') targetTable = installations
        else if (source === 'notes') targetTable = notes
        else continue

        let queryBuilder: any = db.select().from(targetTable)

        // --- Apply Filters ---
        if (config.query?.filters && config.query.filters.length > 0) {
            const conditions = []
            for (const filter of config.query.filters) {
                const fName = String(filter.name)
                let actualColName = fName

                // If column name is prefixed (e.g., "procurements.status"), 
                // only apply this filter to the matching table.
                if (fName.includes('.')) {
                    const [prefix, col] = fName.split('.')
                    if (prefix !== source) continue
                    if (col) actualColName = col
                }

                const col = targetTable[actualColName]
                if (!col) continue

                const val = filter.value
                switch (String(filter.operator).toUpperCase()) {
                    case '=':
                    case ComparisonOperator.EQ:
                        conditions.push(eq(col, val))
                        break
                    case '!=':
                    case ComparisonOperator.NEQ:
                        conditions.push(ne(col, val))
                        break
                    case '>':
                    case ComparisonOperator.GT:
                        conditions.push(gt(col, val))
                        break
                    case '>=':
                    case ComparisonOperator.GTE:
                        conditions.push(gte(col, val))
                        break
                    case '<':
                    case ComparisonOperator.LT:
                        conditions.push(lt(col, val))
                        break
                    case '<=':
                    case ComparisonOperator.LTE:
                        conditions.push(lte(col, val))
                        break
                    case 'LIKE':
                    case ComparisonOperator.CONTAINS:
                        conditions.push(like(col, `%${val}%`))
                        break
                    default:
                        break
                }
            }

            if (conditions.length > 0) {
                queryBuilder.where(and(...conditions))
            }
        }

        // --- Apply Order ---
        if (config.query?.order) {
            const [orderStr, direction] = config.query.order.split(':')
            let actualColName = orderStr

            // Check prefix to see if order applies to this table
            if (orderStr && orderStr.includes('.')) {
                const [prefix, col] = orderStr.split('.')
                actualColName = (prefix === source) ? col : ''
            }

            if (actualColName) {
                const col = targetTable[actualColName]
                if (col) {
                    if (direction?.toUpperCase() === 'DESC') {
                        queryBuilder.orderBy(desc(col))
                    } else {
                        queryBuilder.orderBy(asc(col))
                    }
                }
            }
        }

        // --- Apply Limit ---
        if (config.query?.limit && config.query.limit > 0) {
            queryBuilder.limit(config.query.limit)
        }

        const rawRows: DrizzleRow[] = await queryBuilder

        // Prefix the output keys so they match the frontend's combined schema 
        // Example: { "status": "Done" } -> { "procurements.status": "Done", "status": "Done" }
        const prefixedRows = rawRows.map(row => {
            const pRow: DrizzleRow = {}
            for (const [key, value] of Object.entries(row)) {
                pRow[`${source}.${key}`] = value
                pRow[key] = value // Fallback for backward compatibility
            }
            return pRow
        })

        allRawRows = allRawRows.concat(prefixedRows)
    }

    // Fallback if no columns are configured
    if (!config.columns || config.columns.length === 0) {
        return allRawRows as DataRow[]
    }

    // In-Memory Aggregation across all merged rows
    const groupCols = config.columns.filter((col: ColumnConfig) => !col.aggregation)
    const aggCols = config.columns.filter((col: ColumnConfig) => !!col.aggregation)

    if (aggCols.length === 0) {
        return allRawRows.map((r: DrizzleRow) => {
            const row: DataRow = {}
            config.columns.forEach((col: ColumnConfig) => {
                row[col.name] = r[col.name] as string | number | boolean | null
            })
            return row
        })
    }

    const grouped: Record<string, DrizzleRow[]> = {}
    allRawRows.forEach((r: DrizzleRow) => {
        const key = groupCols.map((c: ColumnConfig) => String(r[c.name])).join('|||')
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(r)
    })

    const result: DataRow[] = []

    for (const [keyStr, items] of Object.entries(grouped)) {
        const row: DataRow = {}
        const keyParts = keyStr.split('|||')

        groupCols.forEach((c: ColumnConfig, index: number) => {
            const val = keyParts[index]
            row[c.name] = !isNaN(Number(val)) && val !== '' ? Number(val) : val
        })

        aggCols.forEach((c: ColumnConfig) => {
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

    if (config.query?.limit && config.query.limit > 0 && result.length > config.query.limit) {
        return result.slice(0, config.query.limit)
    }

    return result
}