import { fetchAndAggregateWidgetData } from './dashboard.service'
import { renderTableWidget } from '~~/server/utils/widget/table'
import { renderChartWidget } from '~~/server/utils/widget/chart'
import { renderProjectSummaryWidget } from '~~/server/utils/widget/summary'
import type { WidgetData, WidgetRenderResult } from '~~/types/dashboard'
import type { H3Event } from 'h3'

interface WidgetRequestParams {
    type: string;
    config: WidgetData['config'];
    height?: number;
}

export async function processWidgetGeneration(event: H3Event, req: WidgetRequestParams): Promise<WidgetRenderResult> {
    const rows = await fetchAndAggregateWidgetData(event, req.config, req.type)

    let html = ''
    let charts: WidgetRenderResult['charts'] = []

    if (req.type === 'table') {
        const res = renderTableWidget(rows, req.config.columns, req.height)
        html = res.html
        charts = res.charts
    } else if (req.type === 'project_summary') {
        const res = renderProjectSummaryWidget(rows, req.config, req.height)
        html = res.html
        charts = res.charts
    } else if (req.type.endsWith('_chart')) {
        const res = renderChartWidget(rows, req.config, req.height)
        html = res.html
        charts = res.charts
    } else {
        throw createError({ statusCode: 400, message: `Unknown widget type: ${req.type}` })
    }

    return { html, charts }
}