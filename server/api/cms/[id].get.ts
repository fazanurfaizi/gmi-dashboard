import { getDashboardById } from '~~/server/service/cms.service'

export default defineEventHandler(async (event) => {
    const id = Number(event.context.params?.id)
    if (!id) throw createError({ statusCode: 400, message: 'Invalid ID' })

    const result = await getDashboardById(event, id)
    return { status: 200, data: result }
})