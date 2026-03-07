import { v4 as uuidv4 } from "uuid"
import { WidgetRenderResult, DataRow, PlotlyTrace, WidgetData, DataValue } from "~~/types/dashboard"

type Trace = PlotlyTrace & {
  text?: DataValue[]
  textposition?: string
  textfont?: { size: number }
}

function cleanAndSortChartData(data: Trace[]): Trace[] {
  return data
    .filter((d) => d.name && d.name !== 'undefined')
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

function resolveSeriesType(seriesType?: string, chartType?: string) {
  if (!seriesType || seriesType === 'auto') return chartType
  return seriesType
}

function cleanRows(rows: DataRow[], chartConfig: WidgetData['config']['chart']) {
  return rows.filter((row) => {
    const xVal = chartConfig.x ? row[chartConfig.x] : 'valid'
    const legendVal = chartConfig.legend ? row[chartConfig.legend] : 'valid'

    if (chartConfig.x && !xVal) return false
    if (chartConfig.legend && !legendVal) return false

    return true
  })
}

function groupRows(rows: DataRow[], legend?: string | null) {
  const groups: Record<string, DataRow[]> = {}

  rows.forEach((row) => {
    const key = legend ? String(row[legend]) : 'Series'
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  return groups
}

function buildTrace(
  items: DataRow[],
  series: WidgetData['config']['chart']['series'][0],
  chartConfig: WidgetData['config']['chart'],
  legendLabel: string,
  chartStyles: WidgetData['config']['chartStyles'],
): Trace {
  const xKey = chartConfig.x!
  const values = items.map((item) => item[series.field])
  const type = resolveSeriesType(series.type, chartConfig.type)

  const trace: Trace = {
    name: legendLabel,
    yaxis: series.axis === "y2" ? "y2" : "y"
  }

  switch (type) {
    case "scatter":
      trace.type = "scatter"
      trace.mode = series.mode || "markers"
      trace.x = items.map(i => i[xKey])
      trace.y = values
      break
    case "line":
      trace.type = "scatter"
      trace.mode = series.mode || "lines+markers"
      trace.x = items.map(i => i[xKey])
      trace.y = values
      break
    case "area":
      trace.type = "scatter"
      trace.mode = series.mode || "lines"
      trace.fill = series.fill || "tozeroy"
      trace.x = items.map(i => i[xKey])
      trace.y = values
      break
    case "column":
      trace.type = "bar"
      trace.x = items.map(i => i[xKey])
      trace.y = values
      break
    case "bar":
      trace.type = "bar"
      trace.orientation = "h"
      trace.y = items.map(i => i[xKey])
      trace.x = values
      break
  }

  if (chartStyles?.labels?.show) {
    trace.text = values
    trace.textposition = chartStyles.labels.position || 'auto'
    if (chartStyles.labels.fontsize) {
      trace.textfont = {
        size: chartStyles.labels.fontsize
      }
    }
  }

  return trace
}

function buildLayout(
  chartConfig: WidgetData["config"]["chart"],
  chartStyles: WidgetData["config"]["chartStyles"],
  height?: number
) {
  const layout: Record<string, unknown> = {
    height: height || 400,
    margin: { l: 50, r: 50, t: 30, b: 60 },
    bargap: 0.35,
    bargroupgap: 0.15,
    ...(chartConfig.options?.layout || {})
  }

  if (chartConfig.type !== "pie") {
    layout.xaxis = { type: "category", categoryorder: "category ascending" }
  }

  if (chartStyles?.options?.barMode) {
    layout.barmode = chartStyles.options.barMode
  }

  if (chartStyles?.legend) {
    const pos = chartStyles.legend.position || 'bottom'

    const map = {
      top: { orientation: "h", y: 1.1, x: 0.5, xanchor: "center" },
      bottom: { orientation: "h", y: -0.25, x: 0.5, xanchor: "center" },
      right: { orientation: "v", x: 1.05, y: 0.5 },
      left: { orientation: "v", x: -0.1, y: 0.5 }
    }

    layout.legend = {
      ...map[pos],
      ...(chartStyles.legend.fontsize
        ? { font: { size: chartStyles.legend.fontsize } }
        : {})
    }

    layout.showlegend = chartStyles.legend.show ?? true
  }

  return layout
}

export function renderChartWidget(
  rows: DataRow[],
  config: WidgetData["config"],
  height?: number
): WidgetRenderResult {
  if (!config?.columns?.length) {
    throw createError({ statusCode: 400, message: "Please fill column config first." })
  }

  const chartConfig = config.chart
  if (!chartConfig?.series?.length) {
    throw createError({ statusCode: 400, message: "Please insert minimal 1 series." })
  }

  const chartId = `widget-${uuidv4()}`

  const filteredRows = cleanRows(rows, chartConfig)
  const groups = groupRows(filteredRows, chartConfig.legend)

  const traces: Trace[] = []

  for (const [groupName, items] of Object.entries(groups)) {
    if (groupName === null || groupName === undefined) continue

    items.sort((a, b) =>
      String(a[chartConfig.x!]).localeCompare(String(b[chartConfig.x!]))
    )

    chartConfig.series.forEach((series) => {
      if (series.name !== undefined || series.name !== null || series.name === "undefined") {
        const trace = buildTrace(
          items,
          series,
          chartConfig,
          series.name || groupName,
          config.chartStyles
        )
        traces.push(trace)
      }
    })
  }

  const layout = buildLayout(chartConfig, config.chartStyles, height)

  const finalConfig = {
    responsive: true,
    displayModeBar: false,
    ...(chartConfig.options?.config || {})
  }

  const html = `
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div id="${chartId}" class="plotly-graph-div" style="min-height:${height}px"></div>
      </div>
    </div>`

  return {
    html,
    charts: [{ id: chartId, data: cleanAndSortChartData(traces), layout, config: finalConfig }]
  }
}