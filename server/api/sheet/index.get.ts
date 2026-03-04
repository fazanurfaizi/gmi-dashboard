import { syncSheets } from '~~/server/service/sheet.service'

export default defineEventHandler(async (event) => {
    const db = useDrizzle(event)
    const config = useRuntimeConfig()
    const spreadsheetId = config.spreadsheetId || event.context.cloudflare.env.NUXT_SPREADSHEET_ID as string

    if (!spreadsheetId) {
        throw createError({ statusCode: 400, message: 'Spreadsheet ID not found in runtime config.' })
    }

    try {
        const result = await syncSheets(db, spreadsheetId)
        
        return { 
            statusCode: 200,
            message: 'Sheet data synchronized successfully',
            summary: result
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to process Google Sheet'
        })
    }
})