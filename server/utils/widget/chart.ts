import { v4 as uuidv4 } from 'uuid'
import { WidgetRenderResult, DataRow, PlotlyTrace, WidgetData } from "~~/types/dashboard";

export function renderChartWidget(
    rows: DataRow[], 
    config: WidgetData['config'], 
    height?: number
): WidgetRenderResult {
    if (!config || !config.columns || config.columns.length === 0) {
        throw createError({ statusCode: 400, message: "Please fill column config first." })
    }

    const chartCfg = config.chart
    if (!chartCfg || !chartCfg.series || chartCfg.series.length === 0) {
        throw createError({ statusCode: 400, message: "Please insert minimal 1 series." })
    }

    const chartId = `widget-${uuidv4()}`
    if (!rows || rows.length === 0) {
        return {
            html: `<div class="row q-col-gutter-md"><div class="col-12"><div id="${chartId}" class="plotly-graph-div"></div></div></div>`,
            charts: [{ id: chartId, data: [], layout: {}, config: {} }]
        }
    }

    const colLabelMap: Record<string, string> = {}
    config.columns.forEach(c => { colLabelMap[c.name] = c.label || c.name })

    const cleanRows = rows.filter(r => {
        const xVal = chartCfg.x ? r[chartCfg.x] : 'valid';
        const legendVal = chartCfg.legend ? r[chartCfg.legend] : 'valid';

        if (chartCfg.x && (xVal === undefined || xVal === null || xVal === 'undefined' || xVal === '')) return false;
        if (chartCfg.legend && (legendVal === undefined || legendVal === null || legendVal === 'undefined' || legendVal === '')) return false;

        return true;
    });

    const groups: Record<string, DataRow[]> = {}
    
    cleanRows.forEach(r => {
        const key = chartCfg.legend ? String(r[chartCfg.legend]) : "Series"
        if (!groups[key]) groups[key] = []
        groups[key]!.push(r)
    })

    const traces: PlotlyTrace[] = []
    const multiSeries = chartCfg.series.length > 1
   
    if (chartCfg.type === "pie") {
        const s = chartCfg.series[0]
        const xField = chartCfg.legend || chartCfg.x;
        
        if (xField && s) {
            traces.push({
                type: "pie",
                labels: rows.map(r => r[xField]),
                values: rows.map(r => r[s.field]),
                name: s.name || colLabelMap[s.field] || s.field
            })
        }
    } else {
        if (!chartCfg.x) throw createError({ statusCode: 400, message: "x axis must be defined" })
        const xKey = chartCfg.x;

        for (const [groupName, items] of Object.entries(groups)) {
            items.sort((a, b) => String(a[xKey]) > String(b[xKey]) ? 1 : -1)

            chartCfg.series.forEach(s => {
                const t = s.type !== "auto" ? s.type : chartCfg.type

                let legendLabel = groupName
                if (s.name) {
                    legendLabel = s.name
                } else if (multiSeries) {
                    const fallbackLabel = colLabelMap[s.field] || s.field;
                    if (s.field.includes('.')) {
                        const tableName = s.field.split('.')[0];
                        if (tableName) legendLabel = tableName.charAt(0).toUpperCase() + tableName.slice(1);
                    } else {
                        legendLabel = fallbackLabel;
                    }
                }

                const trace: PlotlyTrace = {
                    name: legendLabel,
                    x: items.map(i => i[xKey]),
                    y: items.map(i => i[s.field]),
                    yaxis: s.axis === 'y2' ? 'y2' : 'y'
                }

                if (s.mode) trace.mode = s.mode
                else if (t === "line" || t === "area") {
                    trace.type = "scatter"
                    trace.mode = "lines+markers"
                    if (t === "area") trace.fill = s.fill || "tozeroy"
                } else if (t === "column" || t === "bar") {
                    trace.type = "bar"
                    if (t === "bar") trace.orientation = "h"
                    trace.opacity = 0.7
                }

                traces.push(trace)
            })
        }
    }

    const layout: Record<string, unknown> = {
        height: height || 400,
        margin: { l: 50, r: 50, t: 30, b: 60 },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.25 },
        ...(chartCfg.options?.layout || {})
    }

    if (chartCfg.type !== "pie") {
        layout.xaxis = { type: "category", ...(layout.xaxis as object || {}) }
    }

    if (chartCfg.series.some(s => s.axis === 'y2')) {
        layout.yaxis2 = { overlaying: "y", side: "right", showgrid: false, ...(layout.yaxis2 as object || {}) }
    }

    const finalConfig = {
        responsive: true,
        displayModeBar: false,
        ...(chartCfg.options?.config || {})
    }

    const html = `<div class="row q-col-gutter-md">
        <div class="col-12">
            <div id="${chartId}" class="plotly-graph-div" min-height: ${height}px !important; max-height: ${height}px !important;></div>
        </div>
    </div>`

    return { html, charts: [{ id: chartId, data: traces, layout, config: finalConfig }] }
}