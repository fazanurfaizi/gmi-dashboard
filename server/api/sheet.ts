import * as XLSX from 'xlsx'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const spreadsheetId = query.id as string
  const sheetName = query.sheet as string || 'Sheet1'

  if (!spreadsheetId) {
    throw createError({ statusCode: 400, message: 'Spreadsheet ID is required' })
  }

  // We use the Google Visualization API endpoint to export as CSV
  // This is faster and simpler for reading data than the full Sheets API for this use case
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet (Status: ${response.status}). Ensure the sheet is shared with "Anyone with the link".`)
    }

    const arrayBuffer = await response.arrayBuffer()
    
    // Parse the CSV data using XLSX
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]!
    const worksheet = workbook.Sheets[firstSheetName]!

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    // Apply limit if requested (for previewing columns)
    const limit = query.limit ? parseInt(query.limit as string) : 0
    const data = limit > 0 ? jsonData.slice(0, limit) : jsonData

    return {
      status: 200,
      data: data
    }
  } catch (error: any) {
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Failed to process Google Sheet' 
    })
  }
})