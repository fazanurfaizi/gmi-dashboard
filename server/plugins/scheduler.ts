// import { useDrizzle } from '~~/server/utils/db'
// import { syncSheets } from '../service/sheet.service'

// export default defineNitroPlugin((nitroApp) => {
//     const db = useDrizzle()
//     const config = useRuntimeConfig()
//     const spreadsheetId = config.spreadsheetId as string

//     if (!spreadsheetId) {
//         console.warn('⚠️ Spreadsheet ID not found in runtime config.')
//         return
//     }

//     Sync every 30 mins
//     setInterval(async () => {
//         console.log('Running scheduled sheet sync...')
//         await syncSheets(db, spreadsheetId)
//     }, 30 * 60 * 1000)

//     syncSheets(db, spreadsheetId)
// })

