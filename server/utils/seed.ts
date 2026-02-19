import type { Db, Tx } from '~~/server/utils/db'
import { procurements, installations } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export function syncProcurementData(db: Db, data: any[], year: number) {    
    const records = data
        .filter((row: any) => row['No'] && row['Kode Proyek'])
        .map((row: any) => ({
            year: year,
            status: row['Status'],
            no: typeof row['No'] === 'number' ? row['No'] : parseInt(row['No']) || 0,
            projectCode: row['Kode Proyek'],
            projectName: row['Nama Project'],
            location: row['Lokasi Project'],
            pm: row['PM'],
            admin: row['Admin'],
            epc: row['EPC'],
            notes: row['Ket']
        }))

    if (records.length === 0) return

    db.transaction((tx: Tx) => {
        tx.delete(procurements).where(eq(procurements.year, year)).run()
        tx.insert(procurements).values(records).run()
    })
}

export function syncInstallationData(db: Db, rawData: any[][], year: number) {
    // Structure Mapping:
    // Index 0-2 (Rows 1-3): Empty
    // Index 3   (Row 4):    Header 1 (Dates: 01/12/2025...)
    // Index 4   (Row 5):    Header 2 (Sub-headers: Project/Keuangan...)
    // Index 5+  (Row 6+):   Data Rows

    if (rawData.length < 6) return

    const headerRow1 = rawData[3]
    const headerRow2 = rawData[4]
    const dataRows = rawData.slice(5)

    if (headerRow1 && headerRow2) {
        const staticEndIndex = headerRow1.findIndex(c => c && c.toString().toLowerCase().includes('type atap'))
        const dynamicStartIndex = staticEndIndex + 1

        const records: any[] = []

        for (const row of dataRows) {
            // Skip if 'Status' column (Index 0) is empty
            if (!row[0]) continue

            const staticData = {
                year: year,
                status: row[0],
                no: parseInt(row[1]) || 0,
                note: row[2],
                weeklyMeeting: row[3],
                projectCode: row[4],
                projectName: row[5],
                location: row[6],
                capacity: parseFloat(row[7]) || 0,
                unit: row[8],
                pm: row[9],
                admin: row[10],
                sm: row[11],
                manpowerUpdate: row[12],
                epc: row[13],
                developer: row[14],
                roofType: row[15],
            }

            const progressData: Record<string, any> = {}

            // Track the current date across merged cells
            let currentDateKey = ''

            if (dynamicStartIndex > 0) {
                for (let i = dynamicStartIndex; i < row.length; i++) {
                    // Check Row 4 for Date (it might be merged, so only appears once every 2 cols)
                    if (headerRow1[i]) {
                        const rawHeader = headerRow1[i]
            
                        // Check if XLSX parsed it as a Date object
                        if (rawHeader instanceof Date) {
                            const y = rawHeader.getFullYear()
                            const m = String(rawHeader.getMonth() + 1).padStart(2, '0')
                            const d = String(rawHeader.getDate()).padStart(2, '0')
                            currentDateKey = `${y}-${m}-${d}`
                        } else {
                            // Fallback in case it's parsed as a standard string
                            currentDateKey = String(rawHeader).trim()
                        }

                        if (!progressData[currentDateKey]) progressData[currentDateKey] = {}
                    }

                    // Check Row 5 for Category (Project vs Keuangan)
                    const subCategory = headerRow2[i]
                    const cellValue = row[i]

                    if (currentDateKey && subCategory) {
                        const key = subCategory.toString().toLowerCase().includes('keuangan') ? 'finance' : 'project'
                        progressData[currentDateKey][key] = cellValue
                    }
                }
            }

            records.push({
                ...staticData,
                progressData: progressData
            })
        }

        if (records.length === 0) return

        db.transaction((tx: Tx) => {
            tx.delete(installations).where(eq(installations.year, year)).run()
            tx.insert(installations).values(records).run()
        })
    }
}