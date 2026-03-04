import { updateDashboard } from '~~/server/service/cms.service'

export default defineEventHandler(async (event) => {
    const id = Number(event.context.params?.id)
    if (!id) throw createError({ statusCode: 400, message: 'Invalid ID' })

    const body = await readBody(event)
    const result = await updateDashboard(event, id, body)
    
    return { status: 200, data: result }
})