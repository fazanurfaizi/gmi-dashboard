import { v4 as uuidv4 } from 'uuid'

export function renderChartWidget(rows: any[], config: any, height?: number): { html: string, charts: any[] } {
    if (!config || !config.columns || config.columns.length === 0) {
        throw createError({ statusCode: 400, message: "Please fill column config first." })
    }

    const chartCfg = config.chart
    if (!chartCfg || !chartCfg.series || chartCfg.series.length === 0) {
        throw createError({ statusCode: 400, message: "Please insert minimal 1 series." })
    }

    console.log(config)
    const chartId = 'widget_combine_chart_17715187165455e'
    if (!rows || rows.length === 0) {
        return {
            html: `<div class="row q-col-gutter-md"><div class="col-12"><div id="${chartId}" class="plotly-graph-div"></div></div></div>`,
            charts: [{ id: chartId, data: [], layout: {}, config: {} }]
        }
    }

    const colLabelMap: Record<string, string> = {}
    config.columns.forEach((c: any) => { colLabelMap[c.name] = c.label || c.name })

    const groups: Record<string, any[]> = {}
    rows.forEach(r => {
        const key = chartCfg.legend ? r[chartCfg.legend] : "Series"
        if (!groups[String(key)]) groups[String(key)] = []
        groups[String(key)]!.push(r)
    })

    const traces: any[] = []
    const multiSeries = chartCfg.series.length > 1
   
    if (chartCfg.type === "pie") {
        const s = chartCfg.series[0]
        traces.push({
            type: "pie",
            labels: rows.map(r => r[chartCfg.legend || chartCfg.x]),
            values: rows.map(r => r[s.field]),
            name: s.name || colLabelMap[s.field] || s.field
        })
    }
    // AXIS-BASED CHART (Bar, Line, Scatter, Area)
    else {
        if (!chartCfg.x) throw createError({ statusCode: 400, message: "x axis must be defined" })

        for (const [groupName, items] of Object.entries(groups)) {
            // Sort internal items by X-Axis
            items.sort((a, b) => a[chartCfg.x] > b[chartCfg.x] ? 1 : -1)

            chartCfg.series.forEach((s: any) => {
                const t = s.type !== "auto" ? s.type : chartCfg.type

                // Resolve legend label
                let legendLabel = groupName
                if (s.name) legendLabel = s.name
                else if (multiSeries) legendLabel = colLabelMap[s.field] || s.field

                const trace: any = {
                    name: legendLabel,
                    x: items.map(i => i[chartCfg.x]),
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

    // Layout Configuration
    const layout: any = {
        height: height || 400,
        margin: { l: 50, r: 50, t: 30, b: 60 },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.25 },
        ...chartCfg.options?.layout
    }

    if (chartCfg.type !== "pie") {
        layout.xaxis = { type: "category", ...layout.xaxis }
    }

    // Secondary Y axis Check
    if (chartCfg.series.some((s: any) => s.axis === 'y2')) {
        layout.yaxis2 = { overlaying: "y", side: "right", showgrid: false, ...layout.yaxis2 }
    }

    const finalConfig = {
        responsive: true,
        displayModeBar: false,
        ...chartCfg.options?.config
    }

    const html = `<div class="row q-col-gutter-md">
        <div class="col-12">
            <div id="${chartId}" class="plotly-graph-div" style="min-height: ${height}px"></div>
        </div>
    </div>`

    return { html, charts: [{ id: chartId, data: traces, layout, config: finalConfig }] }
}