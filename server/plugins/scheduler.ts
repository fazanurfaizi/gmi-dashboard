import * as XLSX from 'xlsx'
import { useDrizzle } from '~~/server/utils/db'
import type { Db } from '~~/server/utils/db'
import { syncInstallationData, syncProcurementData } from '../utils/seed'

export default defineNitroPlugin((nitroApp) => {
    const db = useDrizzle()
    const config = useRuntimeConfig()
    const spreadsheetId = config.spreadsheetId as string

    if (!spreadsheetId) {
        console.warn('⚠️ Spreadsheet ID not found in runtime config.')
        return
    }

    // Sync every 30 mins
    setInterval(async () => {
        console.log('Running scheduled sheet sync...')
        await syncSheets(db, spreadsheetId)
    }, 30 * 60 * 1000)

    // syncSheets(db, spreadsheetId)
})

async function syncSheets(db: Db, spreadsheetId: string) {
    const currentYear = new Date().getFullYear().toString()

    try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`
        const response = await fetch(url)

        if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.statusText}`)

        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

        for (const sheetName of workbook.SheetNames) {
            const procurementMatch = sheetName.match(/Pengadaan\s*\((\d{4})\)/i)
            const installationMatch = sheetName.match(/Jasa Instalasi\s*\((\d{4})\)/i)

            if (procurementMatch) {
                const year = parseInt(procurementMatch[1] ?? currentYear)
                console.log(`Processing Procuremenets for Year: ${year}`)
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { raw: true, range: 3 })
                syncProcurementData(db, data, year)
            } else if (installationMatch) {
                const year = parseInt(installationMatch[1] ?? currentYear)
                console.log(`Processing Installations for Year: ${year}`)
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { raw: true, header: 1 }) as any[][]
                syncInstallationData(db, data, year)
            }
        }
    } catch (error) {
        console.error(error)
    }
}

