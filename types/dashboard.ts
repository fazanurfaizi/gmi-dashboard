export interface TemplateOption {
    label: string
    type: string
    useTimeframe?: boolean
    useColorSeries?: boolean
    useAdditionalAxes?: boolean
    useCompanyColors?: boolean
    useMaterial?: boolean
    useGrouping?: boolean
    useChartStyles?: boolean
    useQueryFilter?: boolean
    children?: TemplateOption[]
    seriesColors?: ColorSeries[]
}

export type ChartTimeframe = 'daily' | 'monthly' | 'yearly' | null | undefined
export type AdditionalAxisType = 'line' | 'area' | 'stack' | 'group'
export type MaterialType = string | undefined

export interface AdditionalAxisConfig {
    type: AdditionalAxisType
    name: string
    color?: any
    show?: boolean
    lineDash?: string
}

export interface ColorSeries {
    code: string
    color: string
    child?: string
}

export interface ChartStyleConfig {
    xaxis?: { show?: boolean; fontsize?: number }
    yaxis?: { show?: boolean; fontsize?: number }
    y2axis?: { show?: boolean; fontsize?: number }
    legend?: { show?: boolean; position?: 'top' | 'bottom' | 'right' | 'left'; fontsize?: number }
    labels?: { show?: boolean; fontsize?: number; position?: 'auto' | 'inside' | 'outside' }
    lineLabels?: { show?: boolean; fontsize?: number }
    options?: {
        barMode?: 'group' | 'stack' | 'relative' | 'overlay'
        lineDash?: 'solid' | 'dot' | 'dash' | 'longdash' | 'dashdot'
    }
}

export interface TitleConfig {
    align?: 'left' | 'center' | 'right',
    fontsize?: number
}

export interface FilterItem {
    name: string | number | null
    operator: string | number | null
    value: string | number | null
}

export interface WidgetData {
    id?: string
    type: string
    title: string
    config: {
        app: string | null
        endpoint: string | null
        query: {
            limit: number
            order: string
            applyFilterExactDateEnd?: boolean | null
            filters: FilterItem[]
        }
        columns: {
            id?: any
            name?: any
            label?: any
            format?: any
            precision?: number | null
            aggregation?: any
            datefilter?: boolean
        }[]
        chart: {
            type: 'scatter' | 'line' | 'column' | 'bar' | 'area' | 'pie'
            x: string | null
            series: {
                field: string | null
                axis: 'y' | 'y2'
                type: 'auto' | 'scatter' | 'line' | 'column' | 'area'
                mode?: 'lines' | 'markers' | 'text' | 'lines+markers' | 'lines+text' | 'markers+text' | 'lines+markers+text'
                fill?: 'none' | 'tozeroy' | 'tonexty'
            }[]
            legend: string | null
            options?: { layout?: any; config?: any }
        }
        colorSeries: ColorSeries[]
        companies?: string[] | null
        locSchema?: string
        material?: MaterialType
        shows?: string[]
        timeframe?: ChartTimeframe
        timeframeDefaultValue?: number | null
        additionalAxes?: AdditionalAxisConfig[]
        grouping?: AdditionalAxisConfig
        chartStyles?: ChartStyleConfig
        showLineLabel?: boolean | null
        title?: TitleConfig | null | undefined
    }
    x?: number
    y?: number
    w?: number
    h?: number
}

export interface Dashboard {
  id: number | null
  name: string | null
  code: string | null
  templates?: WidgetData[]
  config?: {
    defaultDateFilter?: 'thisWeek'
  }
}