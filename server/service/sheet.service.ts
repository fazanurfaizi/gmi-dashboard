import * as XLSX from 'xlsx'
import type { Db } from '~~/server/utils/db'
import { syncInstallationData, syncProcurementData, syncNotesData } from '../utils/seed'

export async function getSheetData(spreadsheetId: string, targetSheet?: string, limit: number = 0) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet (Status: ${response.status}). Ensure the sheet is shared with "Anyone with the link".`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    if (targetSheet) {
        const worksheet = workbook.Sheets[targetSheet]
        if (!worksheet) throw createError({ statusCode: 404, message: `Sheet "${targetSheet}" not found` })

        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        const data = limit > 0 ? jsonData.slice(0, limit) : jsonData

        return { data }
    }

    const allSheetsData: Record<string, any[]> = {}
    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name]
        if (sheet) allSheetsData[name] = XLSX.utils.sheet_to_json(sheet)
    })

    return { data: allSheetsData, sheetNames: workbook.SheetNames }
}

export async function syncSheets(db: Db, spreadsheetId: string) {
    const currentYear = new Date().getFullYear().toString()
    const processedSheets: string[] = [] // Keep track of what we processed

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Failed to fetch sheet from Google: ${response.statusText} (${response.status})`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
    
    for (const sheetName of workbook.SheetNames) {
        const procurementMatch = sheetName.match(/Pengadaan\s*\((\d{4})\)/i)
        const installationMatch = sheetName.match(/Jasa Instalasi\s*\((\d{4})\)/i)

        if (sheetName === 'Update To Do PM') {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { raw: false, range: 2 })
            syncNotesData(db, data, currentYear)
            processedSheets.push(sheetName)
        } else if (procurementMatch) {
            const year = parseInt(procurementMatch[1] ?? currentYear)
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { raw: true, range: 3 })
            syncProcurementData(db, data, year)
            processedSheets.push(sheetName)
        } else if (installationMatch) {
            const year = parseInt(installationMatch[1] ?? currentYear)
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { raw: true, header: 1 }) as any[][]
            syncInstallationData(db, data, year)
            processedSheets.push(sheetName)
        }
    }

    return {
        totalProcessed: processedSheets.length,
        sheets: processedSheets
    }
}