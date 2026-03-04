import { syncSheets } from '~~/server/service/sheet.service'

export default defineEventHandler(async (event) => {
    const db = useDrizzle(event)
    const config = useRuntimeConfig()
    const spreadsheetId = config.spreadsheetId as string

    if (!spreadsheetId) {
        console.warn('⚠️ Spreadsheet ID not found in runtime config.')
        return
    }

    if (!spreadsheetId) {
        throw createError({ statusCode: 400, message: 'Spreadsheet ID is required' })
    }

    try {
        await syncSheets(db, spreadsheetId)
        return { 
            status: 200,
            message: 'sync sheet data success'
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to process Google Sheet'
        })
    }
})