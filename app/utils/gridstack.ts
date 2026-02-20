import type { GridStackNode } from 'gridstack'
import type { WidgetData } from '~~/types/dashboard'
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css'
// import 'gridstack/dist/gridstack-extra.css';

export const widgets = ref<WidgetData[]>([])
const widgetCustoms = ['basic_chart', 'table']
let grid: any | null = null

export function initGrid(container: HTMLElement) {
    if (process.server) return

    widgets.value = []

    grid = GridStack.init(
        {
            column: 12,
            cellHeight: 50,
            animate: true,
            margin: 3,
            resizable: { handles: 'all' },
            handle: '.grid-stack-handle',
            disableResize: false,
            float: true,
        },
        container
    )

    grid.on('change', (_: any, items: any[]) => {
        items.forEach((item) => {
            const widget = widgets.value.find((w) => w.id === item.id)
            if (!widget) return
            
            const { layout, widget: w } = findWidgetById(item.id)
            if (layout && w) {
                w.x = layout.x
                w.y = layout.y
                w.w = layout.w
                w.h = layout.h
            }
        })
    })
}

export function addWidget(data: WidgetData): WidgetData | null {
    if (!grid) return null
    if (!data?.type) return null

    const id = data?.id || `widget_${data.type}_${Date.now()}${Math.random().toString(36).slice(2, 4)}`
    const lastY = getLastRowY()

    const item: WidgetData = {
        ...data,
        id,
        type: data.type || '',
        title: data.title || '',
        config: data.config,
        x: data.x ?? 0,
        y: data.y ?? lastY,
        w: data.w ?? (window.innerWidth <= 480 ? 12 : 4),
        h: data.h ?? 7,
    }

    const delBtn = createBtn(`removeWidget('${item.id}')`, 'delete')
    const editBtn = createBtn(`editWidget('${item.id}')`, 'edit')
    const color = widgetCustoms.includes(item.type) ? 'accent' : 'primary'
    const showHeader = data.title && data.title.trim() !== '' ? '' : 'display: none;'

    const innerContent = transformInner(item)

    const html = `
        <div class="card-header row items-center justify-between bg-primary round q-px-sm q-py-xs q-mb-sm">
            <div class="card-header-title q-px-sm text-bold text-white" style="${showHeader}">${data.title || ''}</div>
            <div class="row no-wrap items-center q-ml-auto">${editBtn} ${delBtn}</div>
        </div>
        <div class="widget-body">
            <div id="${item.id}_content" class="q-px-sm" style="width:100%;flex:1 1 auto;">
                ${innerContent}
            </div>
        </div>`

    const node: any = {
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,        
    }

    const el = grid.addWidget(node)
    if (el) {
        const contentEl = el.querySelector('.grid-stack-item-content')
        if (contentEl) {
            contentEl.innerHTML = html
        } else {
            el.innerHTML = `<div class="grid-stack-item-content">${html}</div>`
        }
    }

    const existingIdx = widgets.value.findIndex((w) => w.id === id)
    if (existingIdx >= 0) {
        widgets.value[existingIdx] = item
    } else {
        widgets.value.push(item)
    }

    return item
}

export function getWidget(id: string) {
    return widgets.value.find((w) => w.id === id)
}

export function updateWidgetContent(item: any) {
    const { layout, widget } = findWidgetById(item.id)
    if (layout && widget) {
        widget.x = layout.x
        widget.y = layout.y
        widget.w = layout.w
        widget.h = layout.h
        widget.type = item.type
        widget.title = item.title
        widget.config = item.config
    }

    const container = document.getElementById(`${item.id}_content`)
    if (container) container.innerHTML = transformInner(item)

    const w = document.querySelector(`.grid-stack-item[gs-id='${item.id}']`)
    if (w) {
        const header = w.querySelector('.card-header-title')
        if (header) header.textContent = item.title || item.type
        
        // Show/Hide header based on title presence
        const headerContainer = w.querySelector('.card-header-title') as HTMLElement
        if (headerContainer) {
            headerContainer.style.display = (item.title && item.title.trim() !== '') ? '' : 'none'
        }
    }
}

export function removeWidget(id: string) {
    if (!grid) return
    const el: any = document.querySelector(`.grid-stack-item[gs-id="${id}"]`)
    if (el) grid.removeWidget(el)
    widgets.value.splice(0, widgets.value.length, ...widgets.value.filter((w) => w.id !== id))
}

export function removeAllWidget() {
    if (!grid) return
    grid.removeAll()
    widgets.value = []
}

export function getLayout() {
    if (!grid) return []
    const layout = grid.save(true) as GridStackNode[]

    return widgets.value
        .filter((w) => layout.find((l) => l.id === w.id))
        .map((w) => {
            const pos = layout.find((l) => l.id === w.id)
            if (pos) {
                if (!pos.h) pos.h = 1
                if (!pos.w) pos.w = 1
            }
            return {
                ...w,
                ...pos,
            }
        })
}

function findWidgetById(id: string) {
    if (!grid) return {}
    const layouts: any = grid.save(true)
    const layout = layouts.find((e: any) => e.id == id)
    const widget = widgets.value.find((e: any) => e.id == id)
    return { layout, widget }
}

function createList(title: string, lines: string) {
    return `<div class="text-bold">${title}</div><ul class="no-indent">${lines}</ul>`
}

function transformInner(item: any) {
    let text = ''
    const cfg = item?.config || {}

    text += createList('General', `<li>Coordinates (X,Y,W,H): ${item.x ?? 0}, ${item.y ?? 0}, ${item.w ?? 0}, ${item.h ?? 0}</li>`)

    if (cfg.timeframe || cfg.companies || cfg.app || cfg.endpoint || cfg.chartStyles) {
        let textCfg = ''
        if (cfg.timeframe) textCfg += `<li>Timeframe: ${cfg.timeframe}</li>`
        if (Array.isArray(cfg.companies) && cfg.companies.length) textCfg += `<li>Force Company Filter: ${cfg.companies.join(', ')}</li>`
        if (cfg.timeframeDefaultValue !== undefined) textCfg += `<li>Default Range Value: ${cfg.timeframeDefaultValue}</li>`
        if (cfg.app) textCfg += `<li>App: ${cfg.app}</li>`
        if (cfg.endpoint) textCfg += `<li>Endpoint: ${cfg.endpoint}</li>`
        if (cfg.chartStyles) {
            const s = cfg.chartStyles
            if (s.fontFamily) textCfg += `<li>Font: ${s.fontFamily}</li>`
            if (s.options?.barMode) textCfg += `<li>Bar Mode: ${s.options.barMode}</li>`
            if (s.legend) textCfg += `<li>Legend Font: ${s.legend.size || '-'}px ${s.legend.bold ? '(Bold)' : ''}</li>`
            if (s.xaxis) textCfg += `<li>X-Axis Font: ${s.xaxis.size || '-'}px ${s.xaxis.bold ? '(Bold)' : ''}</li>`
            if (s.yaxis) textCfg += `<li>Y-Axis Font: ${s.yaxis.size || '-'}px ${s.yaxis.bold ? '(Bold)' : ''}</li>`
        }
        if (textCfg !== '') text += createList('Config', textCfg)
    }

    if (cfg.query && Array.isArray(cfg.query.filters) && cfg.query.filters.length) {
        text += createList('Query', `<li>Filters Count: ${cfg.query.filters.length}</li>`)
    }

    if (cfg.chart) {
        let textChart = ''
        const series = cfg.chart?.series.map((v: any) => `${v.field} (${v.type})`).join(', ')
        if (series && cfg.chart?.type) textChart += `<li>Chart Type: ${cfg.chart.type}</li>`
        if (series) textChart += `<li>${series || '-'}</li>`
        if (textChart !== '') text += createList('Chart', textChart)
    }

    if (Array.isArray(cfg.colorSeries) && cfg.colorSeries.length) {
        const series = cfg.colorSeries.map((v: any) => `${v.code} (${v.color})`).join(', ')
        if (series) text += createList('Color Series', `<li>${series}</li>`)
    }

    if (Array.isArray(cfg.columns)) {
        const count = cfg.columns.filter((v: any) => v?.include === true).length
        if (count) text += createList('Columns', `<li>${count}</li>`)
    }

    return text
}

function createBtn(action: string, icon: string) {
    return `<button class="q-btn q-btn-item non-selectable no-outline q-btn--flat q-btn--round text-white q-btn--actionable q-focusable q-hoverable q-btn--dense bg-soft" tabindex="0" type="button" onclick="${action}"><span class="q-focus-helper" tabindex="-1"></span><span class="q-btn__content text-center col items-center q-anchor--skip justify-center row"><i class="q-icon notranslate material-icons" aria-hidden="true" role="img">${icon}</i></span></button>`
}

function getLastRowY() {
    if (!widgets.value.length) return 0
    return Math.max(...widgets.value.map((w) => (w.y ?? 0) + (w.h ?? 0)))
}