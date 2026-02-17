import { Dark } from 'quasar'
import { WidgetType } from '~~/types/dashboard'
import type { ChartConfig, ChartStyleConfig } from '~~/types/dashboard'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const transformChartConfig = (config: ChartConfig, data: any[]) => {
  const traces: any[] = [];
  const layout: any = {
    title: config.title,
    showlegend: config.styles?.showLegend !== false,
    legend: {
      orientation: config.styles?.legendPosition === 'bottom' || config.styles?.legendPosition === 'top' ? 'h' : 'v',
      y: config.styles?.legendPosition === 'bottom' ? -0.2 : config.styles?.legendPosition === 'top' ? 1.1 : 1,
      x: config.styles?.legendPosition === 'right' ? 1.05 : config.styles?.legendPosition === 'left' ? -0.2 : 0,
    },
    xaxis: {
      title: config.styles?.xAxisLabel,
      showgrid: config.styles?.showGrid !== false,
      visible: config.styles?.showXAxis !== false,
    },
    yaxis: {
      title: config.styles?.yAxisLabel,
      showgrid: config.styles?.showGrid !== false,
      visible: config.styles?.showYAxis !== false,
    },
    margin: { t: 40, r: 20, l: 40, b: 40 },
  };

  if (!data || data.length === 0) return { data: [], layout };

  const dimension = config.dimensions?.[0];
  const metric = config.metrics?.[0];

  if (!dimension || !metric) return { data: [], layout };

  const xValues = data.map(d => d[dimension]);
  const yValues = data.map(d => d[metric]);

  switch (config.type) {
    case WidgetType.BAR:
      traces.push({
        x: xValues,
        y: yValues,
        type: 'bar',
        name: metric,
        marker: {
          color: config.styles?.colorPalette?.[0]
        }
      });
      
      // Line Overlay (Combo Chart)
      if (config.secondAxis) {
        const y2Values = data.map(d => d[config.secondAxis!]);
        traces.push({
          x: xValues,
          y: y2Values,
          type: config.secondAxisType === 'bar' ? 'bar' : 'scatter',
          mode: config.secondAxisType === 'bar' ? undefined : 'lines+markers',
          name: config.secondAxis,
          yaxis: 'y2',
          line: {
             shape: config.styles?.lineShape || 'linear',
             width: 2
          }
        });
        layout.yaxis2 = {
          title: config.secondAxis,
          overlaying: 'y',
          side: 'right',
          showgrid: false
        };
      }
      
      if (config.styles?.isStacked) {
        layout.barmode = 'stack';
      }
      break;

    case WidgetType.LINE:
    case WidgetType.AREA:
      traces.push({
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: config.styles?.showMarkers ? 'lines+markers' : 'lines',
        fill: config.type === WidgetType.AREA || config.styles?.fillArea ? 'tozeroy' : 'none',
        name: metric,
        line: {
          shape: config.styles?.lineShape || 'linear',
          width: config.styles?.lineWidth || 2,
          color: config.styles?.colorPalette?.[0]
        }
      });
      break;

    case WidgetType.PIE:
    case WidgetType.DONUT:
      traces.push({
        labels: xValues,
        values: yValues,
        type: 'pie',
        hole: config.type === WidgetType.DONUT || config.styles?.holeSize ? (config.styles?.holeSize || 0.5) : 0,
        name: metric,
        marker: {
          colors: config.styles?.colorPalette
        }
      });
      break;
      
    case WidgetType.WATERFALL:
      // Simple waterfall implementation
      // For more complex relative/total logic, we might need a 'measure' column in data
      const measure = config.measureColumn ? data.map(d => d[config.measureColumn!]) : undefined;
      
      traces.push({
        x: xValues,
        y: yValues,
        measure: measure,
        type: 'waterfall',
        name: metric,
        connector: {
          line: {
            color: config.styles?.connectorLineColor || 'rgb(63, 63, 63)'
          }
        },
        increasing: { marker: { color: config.styles?.increasingColor || '#2E7D32' } },
        decreasing: { marker: { color: config.styles?.decreasingColor || '#D32F2F' } },
        totals: { marker: { color: config.styles?.totalColor || '#1976D2' } }
      });
      break;

    case WidgetType.SPARKLINE:
      // Sparkline is a stripped down chart
      layout.showlegend = false;
      layout.xaxis.visible = false;
      layout.xaxis.showgrid = false;
      layout.yaxis.visible = false;
      layout.yaxis.showgrid = false;
      layout.margin = { t: 5, r: 5, l: 5, b: 5 }; // Minimize margins

      traces.push({
        x: xValues,
        y: yValues,
        type: config.styles?.sparklineType === 'bar' ? 'bar' : 'scatter',
        mode: config.styles?.sparklineType === 'bar' ? undefined : 'lines',
        fill: config.styles?.sparklineType === 'area' ? 'tozeroy' : 'none',
        name: metric,
        line: {
          color: config.styles?.colorPalette?.[0] || '#2196F3',
          width: 2
        }
      });
      break;

    case WidgetType.SCATTER:
      traces.push({
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'markers',
        name: metric,
        marker: {
          size: config.styles?.markerSize || 10,
          color: config.styles?.colorPalette?.[0]
        }
      });
      break;
  }

  return { data: traces, layout };
};

export const enhanceXAxisDensity = (ch: any, timeframe: string, screen: any) => {
    const xaxis = ch.layout?.xaxis
    if (!xaxis) return
    if (ch.meta?.forceXaxis) return

    const isDaily = timeframe === 'daily'
    const isMonthly = timeframe === 'monthly'
    const isYearly = timeframe === 'yearly'

    const xvals = ch.data?.[0]?.x || []
    const totalPoints = xvals.length

    if (!ch.layout.xaxis.tickfont) ch.layout.xaxis.tickfont = {}

    if (isDaily) {
        let maxTicksAllow = 21
        if (screen.lt.sm) maxTicksAllow = 7
        else if (screen.lt.md) maxTicksAllow = 14

        let intervalDay = Math.ceil(totalPoints / maxTicksAllow)
        if (intervalDay < 1) intervalDay = 1

        ch.layout.xaxis.tickmode = 'linear'
        ch.layout.xaxis.dtick = intervalDay * ONE_DAY_MS

        if (totalPoints > 60) ch.layout.xaxis.tickangle = -60
        else if (totalPoints > 30) ch.layout.xaxis.tickangle = -45
        else ch.layout.xaxis.tickangle = 0

        if (screen.lt.md) ch.layout.xaxis.tickfont.size = totalPoints > 30 ? 9 : 10
        else ch.layout.xaxis.tickfont.size = totalPoints > 60 ? 10 : 12

        if (totalPoints <= 30) ch.layout.xaxis.tickformat = '%d'
    }

    if (isMonthly) {
        const years = totalPoints / 12

        if (years <= 2) {
            if (totalPoints > 18) ch.layout.xaxis.tickangle = -45
            if (totalPoints > 24) ch.layout.xaxis.tickangle = -60

            if (screen.lt.md) ch.layout.xaxis.tickfont.size = totalPoints > 18 ? 9 : 10
            else ch.layout.xaxis.tickfont.size = totalPoints > 24 ? 10 : 12
        } else if (years <= 4) {
            ch.layout.xaxis.tickangle = -45
            ch.layout.xaxis.tickvals = xvals
            ch.layout.xaxis.ticktext = xvals.map((d: string) => {
                const date = new Date(d)
                const month = date.toLocaleString('default', { month: 'short' })
                if (date.getMonth() === 0) return `<b>${month}</b><br>${date.getFullYear()}`
                return month
            })
        } else {
            ch.layout.xaxis.tickvals = xvals
            ch.layout.xaxis.ticktext = xvals.map((d: string) => {
                const date = new Date(d)
                const m = date.getMonth()
                const year = date.getFullYear()
                if (m === 0) return `<b>Q1</b><br>${year}`
                if (m === 3) return 'Q2'
                if (m === 6) return 'Q3'
                if (m === 9) return 'Q4'
                return ''
            })
            ch.layout.xaxis.tickangle = 0
            ch.layout.xaxis.tickfont.size = screen.lt.md ? 9 : 11
        }

        if (screen.lt.md && years > 2) {
            ch.layout.xaxis.tickvals = xvals
            ch.layout.xaxis.ticktext = xvals.map((d: string) => {
                const date = new Date(d)
                const m = date.getMonth()
                const year = date.getFullYear()
                if (m === 0) return `<b>${year}</b>`
                if (m === 6) return 'H2'
                return ''
            })
        }
    }

    if (isYearly) {
        if (totalPoints > 12) ch.layout.xaxis.tickangle = -45
        if (totalPoints > 20) ch.layout.xaxis.tickangle = -60

        if (screen.lt.md) ch.layout.xaxis.tickfont.size = totalPoints > 15 ? 9 : 10
        else ch.layout.xaxis.tickfont.size = totalPoints > 20 ? 10 : 12
    }
}

const FAKE_BOX = {
    DARK_MINING: "<span style='font-weight:600;letter-spacing:0.2px;text-shadow:" + '0 0 3px rgba(0,0,0,1),' + '0 0 6px rgba(0,0,0,1),' + '0 0 10px rgba(0,0,0,0.95),' + "0 0 16px rgba(0,0,0,0.9);'>%{text}</span>",
    MOBILE: "<span style='font-weight:600;text-shadow:" + '0 0 2px rgba(0,0,0,1),' + '0 0 5px rgba(0,0,0,0.95),' + "0 0 9px rgba(0,0,0,0.9);'>%{text}</span>",
    HIGH_DENSITY: "<span style='font-weight:600;text-shadow:" + '0 0 3px rgba(0,0,0,1),' + "0 0 6px rgba(0,0,0,0.95);'>%{text}</span>",
}

const pickLabelPreset = (screen: { lt: { md: any } }, barCount: number) => {
    if (barCount > 120) return FAKE_BOX.HIGH_DENSITY
    if (screen.lt.md) return FAKE_BOX.MOBILE
    return FAKE_BOX.DARK_MINING
}

const smartHideStackedText = (values: number[], texts: string[], ratio = 0.12) => {
    if (!values?.length) return texts
    const max = Math.max(...values, 0)
    const threshold = max * ratio
    return values.map((v, i) => (v < threshold ? '' : texts[i]))
}

export const barLabelStyling = (ch: any, screen: any, config?: ChartStyleConfig['labels']) => {
    if (config && !config.show) {
        if (Array.isArray(ch.data)) {
            ch.data.forEach((trace: any) => {
                if (trace.type === 'bar') {
                    trace.textposition = 'none'
                    trace.textinfo = 'none'
                    trace.texttemplate = ''
                }
            })
        }
        return
    }

    const barCount = ch.data?.[0]?.x?.length || 0
    const labelPreset = pickLabelPreset(screen, barCount)

    if (Array.isArray(ch.data)) {
        ch.data.forEach((trace: any) => {
            const isBar = trace.type === 'bar'
            const isPie = trace.type === 'pie' || trace.type === 'donut'

            if (!isBar && !isPie) return
            if (isBar && !trace.text && !trace.y) return

            if (isBar && screen.lt.md && trace.y) {
                trace.text = smartHideStackedText(trace.y, trace.text || trace.y, 0.12)
            }

            if (isBar) trace.texttemplate = labelPreset
            if (!trace.textfont) trace.textfont = {}

            trace.textfont.color = '#FFFFFF'
            trace.textfont.size = screen.xs ? 10 : 12
            trace.constraintext = 'both'
            trace.cliponaxis = false

            if (screen.lt.md) {
                trace.textposition = 'inside'
                trace.insidetextanchor = 'middle'
            } else {
                if (!trace.textposition) trace.textposition = 'outside'
            }

            if (config) {
                if (config.fontsize) trace.textfont.size = config.fontsize
                if (config.position && config.position !== 'auto') {
                    trace.textposition = config.position
                    if (config.position === 'outside') trace.insidetextanchor = undefined
                }
            }
        })
    }
}

function getContrastFontColor(hex: string) {
    hex = hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155 ? '#000000' : '#FFFFFF'
}

const buildFloatingLabelAnnotation = (trace: any, traceIndex: number, layout: any, screen: any, mode: 'last' | 'max' | 'min' = 'last') => {
    if (!trace?.x?.length || !trace?.y?.length) return null

    let index = trace.y.length - 1
    if (mode === 'max') index = trace.y.indexOf(Math.max(...trace.y))
    if (mode === 'min') index = trace.y.indexOf(Math.min(...trace.y))

    const x = trace.x[index]
    const y = trace.y[index]

    if (x == null || y == null) return null

    const lineColor = resolveTraceColor(trace, traceIndex, layout)
    const yref = trace.yaxis || 'y'
    const format2 = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return {
        x,
        y,
        xref: 'x',
        yref: yref,
        text: formatCompactNumber(y),
        showarrow: false,
        font: {
            color: getContrastFontColor(lineColor),
            size: screen.xs ? 9 : 10,
        },
        bgcolor: hexToRgba(lineColor, 0.95),
        bordercolor: hexToRgba(lineColor, 1),
        borderpad: 3,
        yshift: 12,
        align: 'center',
        hovertext: `${mode.toUpperCase()}: ${format2(y)}`,
        hoverinfo: 'text',
    }
}

export const lineLabelStyling = (ch: any, screen: any, config?: ChartStyleConfig['lineLabels']) => {
    if (!ch.layout.annotations) ch.layout.annotations = []
    if (config && config.show === false) {
        ch.layout.annotations = []
        return
    }

    if (Array.isArray(ch.data)) {
        ch.data.forEach((trace: any, i: number) => {
            if (!trace.mode?.includes('lines') && trace.type !== 'scatter') return

            const pushAnn = (ann: any) => {
                if (!ann) return
                if (config?.fontsize) ann.font.size = config.fontsize
                ch.layout.annotations.push(ann)
            }

            pushAnn(buildFloatingLabelAnnotation(trace, i, ch.layout, screen, 'min'))
            pushAnn(buildFloatingLabelAnnotation(trace, i, ch.layout, screen, 'max'))
            pushAnn(buildFloatingLabelAnnotation(trace, i, ch.layout, screen, 'last'))
        })
    }
}

function getPlotlyTheme(isDark: boolean) {
    if (isDark) {
        return {
            template: 'plotly_dark',
            paper_bgcolor: '#121212',
            plot_bgcolor: '#121212',
            font: { color: '#e0e0e0' },
            gridcolor: '#444',
            zerolinecolor: '#666',
        }
    }
    return {
        template: 'plotly_white',
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff',
        font: { color: '#1f2937' },
        gridcolor: '#e5e7eb',
        zerolinecolor: '#9ca3af',
    }
}

export function getLayout(ch: any, screen: any) {
    if (!ch.layout) ch.layout = {}
    const isDark = Dark.isActive
    const theme = getPlotlyTheme(isDark)

    const maxDataLength = Math.max(...(ch.data || []).map((d: any) => (d?.y ? d.y.length : 0)), 0)
    const showYAxisLabel = screen.lt.md ? maxDataLength > 14 : maxDataLength > 30

    ch.layout.template = theme.template
    ch.layout.paper_bgcolor = theme.paper_bgcolor
    ch.layout.plot_bgcolor = theme.plot_bgcolor
    ch.layout.font = theme.font

    ch.layout.xaxis = {
        ...(ch.layout.xaxis || {}),
        zerolinecolor: theme.zerolinecolor,
        linecolor: theme.gridcolor,
    }

    ch.layout.yaxis = {
        ...(ch.layout.yaxis || {}),
        gridcolor: theme.gridcolor,
        zerolinecolor: theme.zerolinecolor,
        linecolor: theme.gridcolor,
        tickformat: '~s',
    }

    if (!ch.meta?.forceLayout) {
        ch.layout.xaxis.showgrid = false
        ch.layout.yaxis.showgrid = showYAxisLabel
        ch.layout.yaxis.griddash = 'dot'
        ch.layout.yaxis.showticklabels = showYAxisLabel
    }

    ch.layout.dragmode = false
    ch.layout.showline = false
    ch.layout.linewidth = 0.5
    ch.layout.opacity = 0.3

    if (screen.lt.md) {
        ch.layout.autosize = true
        ch.layout.height = undefined
    }

    const forceLegend = ch.meta?.forceLegend || false
    if (!forceLegend) {
        ch.layout.legend = {
            orientation: 'h',
            y: 1.05,
            x: 0,
            xanchor: 'left',
            yanchor: 'bottom',
            font: { size: screen?.lt?.md ? 10 : 12 },
        }
        ch.layout.margin = { t: 0, l: 25, r: 25, b: 0 }
    }
}

export function getConfig(ch: any) {
    ch.config.responsive = true
    ch.config.scrollZoom = false
    ch.config.displayModeBar = false
    ch.config.displaylogo = false
}

const formatCompactNumber = (num: number) => {
    if (num == null || isNaN(num)) return ''
    const abs = Math.abs(num)
    if (abs >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T'
    if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
    if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (abs >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    return num.toString()
}

const hexToRgba = (hex: string, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getColorway(layout: any) {
    // @ts-ignore
    return layout?.colorway || window.Plotly?.defaults?.colorway || ['#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52']
}

function resolveTraceColor(trace: any, traceIndex: any, layout: any) {
    if (trace?.line?.color) return trace.line.color
    if (trace?.marker?.color) return trace.marker.color
    const colorway = getColorway(layout)
    return colorway[traceIndex % colorway.length]
}

const applyLegendStyles = (ch: any, config: any) => {
    if (!config) return
    if (!ch.layout.legend) ch.layout.legend = {}
    if (!ch.layout.legend.font) ch.layout.legend.font = {}

    if (config.show === false) {
        ch.layout.showlegend = false
        return
    }

    ch.layout.showlegend = true
    if (config.fontsize) ch.layout.legend.font.size = config.fontsize

    const pos = config.position
    if (pos) {
        if (pos === 'bottom') {
            ch.layout.legend.orientation = 'h'
            ch.layout.legend.y = -0.2
            ch.layout.legend.x = 0.5
            ch.layout.legend.xanchor = 'center'
        } else if (pos === 'top') {
            ch.layout.legend.orientation = 'h'
            ch.layout.legend.y = 1.1
            ch.layout.legend.x = 0.5
            ch.layout.legend.xanchor = 'center'
        } else if (pos === 'left') {
            ch.layout.legend.orientation = 'v'
            ch.layout.legend.x = -0.2
            ch.layout.legend.xanchor = 'right'
        } else {
            ch.layout.legend.orientation = 'v'
            ch.layout.legend.x = 1.02
            ch.layout.legend.xanchor = 'left'
        }
    }
}

const calculateForceYAxis = (ch: any, screen: any) => {
    const maxDataLength = Math.max(...(ch.data || []).map((d: any) => (d?.y ? d.y.length : 0)), 0)
    return screen.lt.md ? maxDataLength > 14 : maxDataLength > 30
}

const applyAxisStyles = (ch: any, axisName: string, config: any, forceVisible = false) => {
    if (!config) return
    if (!ch.layout[axisName]) ch.layout[axisName] = {}
    const axis = ch.layout[axisName]

    if (forceVisible) {
        axis.visible = true
        axis.showticklabels = true
        axis.showgrid = true
    } else {
        axis.visible = config.show
        axis.showticklabels = config.show
        axis.showgrid = config.show && axisName === 'yaxis'
    }

    if (config.fontsize) {
        if (!axis.tickfont) axis.tickfont = {}
        axis.tickfont.size = config.fontsize
    }

    if (config.tickangle !== undefined && config.tickangle !== null) {
        axis.tickangle = config.tickangle
    }
}

const applyTraceStyles = (ch: any, styles: any) => {
    if (!Array.isArray(ch.data)) return
    const labelConfig = styles.labels

    ch.data.forEach((trace: any) => {
        if (labelConfig) {
            if (!labelConfig.show) {
                trace.textposition = 'none'
                trace.texttemplate = ''
            } else {
                if (labelConfig.position) trace.textposition = labelConfig.position
                if (labelConfig.fontsize) {
                    if (!trace.textfont) trace.textfont = {}
                    trace.textfont.size = labelConfig.fontsize
                }
                if ((trace.type === 'scatter' || trace.type === 'line') && labelConfig.show) {
                    if (!trace.mode) trace.mode = 'lines+markers+text'
                    else if (!trace.mode.includes('text')) trace.mode += '+text'
                }
            }
        }
    })
}

const applyLineLabels = (ch: any, screen: any, config: any) => {
    if (!config || !config.show) {
        ch.layout.annotations = []
        return
    }

    if (!ch.layout.annotations) ch.layout.annotations = []

    if (Array.isArray(ch.data)) {
        ch.data.forEach((trace: any, i: number) => {
            if (!trace.mode?.includes('lines') && trace.type !== 'scatter') return

            const modes = ['min', 'max', 'last'] as const
            modes.forEach((mode) => {
                const ann = buildFloatingLabelAnnotation(trace, i, ch.layout, screen, mode)
                if (ann) {
                    if (config.fontsize) ann.font.size = config.fontsize
                    if (config.position) {
                        if (config.position === 'inside' || config.position === 'bottom') ann.yshift = -15
                        else if (config.position === 'outside' || config.position === 'top') ann.yshift = 15
                        else ann.yshift = 15
                    }
                    ch.layout.annotations.push(ann)
                }
            })
        })
    }
}

const applyDomStyles = (target: HTMLElement, styles: any) => {
    const fwLegend = styles.legend?.bold ?? 'normal'
    const fwX = styles.xaxis?.bold ?? 'normal'
    const fwY = styles.yaxis?.bold ?? 'normal'

    target.style.setProperty('--legend-weight', fwLegend)
    target.style.setProperty('--xaxis-weight', fwX)
    target.style.setProperty('--yaxis-weight', fwY)
}

export const applyChartStyles = (ch: any, styles: any, screen: any, target?: HTMLElement) => {
    if (!styles) return
    if (!ch.layout) ch.layout = {}
    if (!ch.layout.font) ch.layout.font = {}

    const forceY = calculateForceYAxis(ch, screen)

    applyLegendStyles(ch, styles.legend)
    applyAxisStyles(ch, 'xaxis', styles.xaxis)
    applyAxisStyles(ch, 'yaxis', styles.yaxis, forceY)
    applyAxisStyles(ch, 'yaxis2', styles.y2axis)

    if (styles.options?.barMode) {
        ch.layout.barmode = styles.options.barMode
    }

    barLabelStyling(ch, screen, styles.labels)
    lineLabelStyling(ch, screen, styles.lineLabels)
    applyTraceStyles(ch, styles)

    if (styles.lineLabels) applyLineLabels(ch, screen, styles.lineLabels)
    if (target) applyDomStyles(target, styles)
}

export const applyTitleStyles = (titleEl: HTMLElement | null, config: any) => {
    if (!titleEl) return
    titleEl.style.removeProperty('font-size')
    if (!config) return
    if (config.fontsize) {
        titleEl.style.fontSize = `${config.fontsize}px`
    }
}