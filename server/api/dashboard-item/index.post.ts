import { fetchAndAggregateWidgetData } from '~~/server/utils/widget/dataFetcher'
import { renderChartWidget } from '~~/server/utils/widget/chart'

export default defineEventHandler(async (event) => {
    const req = await readBody(event)

    const rows = await fetchAndAggregateWidgetData(req.config)

    let html = ''
    let charts = []

    if (req.type === 'table') {
        const res = renderTableWidget(rows, req.config.columns)
        html = res.html
        charts = res.charts
    } else if (['basic_chart', 'bar_chart', 'area_chart'].includes(req.type)) {
        const res = renderChartWidget(rows, req.config, req.height)
        html = res.html
        charts = res.charts
    } else {
    throw createError({ statusCode: 400, message: `Unknown widget type: ${req.type}` });
  }

    return {
        status: 200,
        data: {
            html,
            charts
        }
    }
})