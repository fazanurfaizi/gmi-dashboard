import { getClientDashboard } from '~~/server/service/dashboard.service'

export default defineEventHandler(async (event) => {
    const result = await getClientDashboard(event, 1)
    
    return { status: 200, data: result }
})