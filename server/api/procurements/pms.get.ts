import { getProcurementPMs } from '~~/server/service/procurement.service'

export default defineEventHandler(async (event) => {
    try {
        const pms = await getProcurementPMs(event)
        
        return {
            status: 200,
            data: pms
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch PMs'
        })
    }
})