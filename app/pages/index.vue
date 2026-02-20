<template>
    <q-page padding class="q-px-md q-py-sm">
        <spinner-loading v-if="loading" />
        <q-card v-else flat style="border-radius: 8px 0px 0px 0px" class="q-pa-sm">
            <div class="row items-center q-mb-md q-col-gutter-md">
                <div class="col-12 col-md-6 flex items-center">
                    <div class="text-h6 text-weight-bold">{{ dataModel.name }}</div>
                </div>

                <div class="col-12 col-md-6 flex justify-end items-center">
                    <q-btn size="sm" icon="event" color="secondary" :label="labelDate" class="q-ma-sm">
                        <q-menu cover anchor="top middle">
                            <q-date minimal dense v-model="filter.date" years-in-month-view emit-immediately
                                mask="YYYY-MM-DD" event-color="red">
                                <div class="q-py-sm text-h6 text-center text-primary">{{ labelDate }}</div>
                                <q-separator inset />
                                <div class="row items-center justify-end q-gutter-sm">
                                    <q-btn label="Cancel" color="primary" flat v-close-popup />
                                    <q-btn label="Apply Filter" color="primary" flat @click="submitDate"
                                        v-close-popup />
                                </div>
                            </q-date>
                        </q-menu>
                    </q-btn>
                </div>
            </div>
        </q-card>

        <div class="dashboard-grid">
            <div v-for="(item, i) in dataModel.widgets" :key="i" class="q-mb-sm dashboard-item" :style="getGridStyle(item)">
                <q-card flat bordered class="q-px-sm q-py-md relative-position">
                <div v-if="!item.loading" class="absolute-top-right q-pa-xs row q-gutter-sm no-wrap">
                    <filter-date-widget v-if="chartDateIncludes.includes(item.type) && item.dates" v-model="dataModel.widgets[i]" @on-filter="forceFilterDate" />

                    <q-btn flat round dense color="secondary" size="xs" icon="table_chart" @click="showTable(item)" v-if="tableIncludes.includes(item.type)">
                        <q-tooltip>Show Raw Data Table</q-tooltip>
                    </q-btn>

                    <q-btn flat round dense color="secondary" size="xs" :icon="item.showLineLabel ? 'label' : 'label_off'" @click="fetchWidget(item, true)" v-if="chartLineIncludes.includes(item.type)">
                        <q-tooltip>{{ item.showLineLabel ? 'Hide' : 'Show' }} Line Label</q-tooltip>
                    </q-btn>

                    <q-btn flat round dense color="secondary" size="xs" icon="refresh" @click="fetchWidget(item)">
                        <q-tooltip>Refresh Widget</q-tooltip>
                    </q-btn>
                </div>
                <q-skeleton v-if="item.loading" :height="`${item.h * 50 + (item.title ? item.config?.title?.fontsize || 17 : 0)}px`" />
                <template v-else>
                    <div v-if="item.title" class="q-px-sm dash-title ellipsis">{{ item.title }}</div>
                    <div v-else class="q-pb-sm"></div>
                    <div :ref="(el: any) => setWidgetRef(el, item.id)" :id="item.id"></div>
                </template>
                </q-card>
            </div>
        </div>

        <q-dialog v-model="dialog.show" :maximized="dialog.maximize" :persistent="dialog.persistent">
            <q-card :style="dialog.maximize ? '' : 'min-width: 60vw'">
                <q-toolbar class="bg-primary text-white">
                    <q-toolbar-title>{{ dialog.title }}</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup />
                </q-toolbar>
                <q-card-section>
                    <TableView v-if="dialog.props" :data="dialog.props" :title="dialog.title" />
                    <div v-else class="text-grey-6">No table data to display.</div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { chartDateIncludes, tableIncludes } from '~/utils/meta'
import { enhanceXAxisDensity, getLayout, getConfig, applyChartStyles, applyTitleStyles } from '~/utils/chartHelper'
import { buildRange } from '~/utils/dateHelper'
import { useQuasar } from 'quasar'

definePageMeta({
    layout: 'dashboard'
})

const dialog = ref<any>({
    show: false,
    type: 'detail',
    title: 'Table Detail',
    props: null,
    maximize: false,
    persistent: false,
})
const { registerPlotlyContainer } = usePlotlyAutoResize()
const $api = useApi()
const props = defineProps({
    code: { type: String, required: false },
})
const $q = useQuasar()
const { render } = useSafeHtml()

const dataModel = ref<any>({
    name: '',
    widgets: [],
})

const loading = ref(false)

const filter = ref<any>({
    date: today(),
})

const labelDate = computed(() => {
    return readDate(filter.value.date)
})

const chartStore = new Map<string, any>()
const widgetRefs = new Map<string, HTMLElement>()

const setWidgetRef = (el: HTMLElement | null, id: string) => {
    if (!el) return
    widgetRefs.set(id, el)
    registerPlotlyContainer(el)
}

onMounted(async () => {
    loading.value = true

    if (typeof window === 'undefined') return
    if (!window.Plotly) {
        const mod = await import('plotly.js-dist-min')
        window.Plotly = mod.default
    }

    await $api.get('dashboard').then((res: any) => {
        const data = res.data || res
        loading.value = false
        if (data) {
            dataModel.value = data
        }
    })
    await onRefresh()
})

const onRefresh = async () => {
    if (dataModel.value.widgets && dataModel.value.widgets.length) {
        await Promise.all(dataModel.value.widgets.map((t: any) => fetchWidget(t)))
    }
}

const forceFilterDate = async (t: any) => {
    if (t.dates) await fetchWidget(t, t.dates)
}

const getGridStyle = (item: any) => {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
  }
}

const fetchWidget = async (t: any, toggleLineLabel: boolean = true, forceDates: any = null) => {
    if (!t.config) t.config = {}
    if (!t.config.chartStyles) t.config.chartStyles = {}
    if (!t.config.chartStyles.lineLabels) t.config.chartStyles.lineLabels = { show: true }

    if (t.showLineLabel === undefined) {
        t.showLineLabel = t.config.chartStyles.lineLabels.show
    }

    if (toggleLineLabel) {
        t.showLineLabel = !t.showLineLabel
        t.config.chartStyles.lineLabels.show = t.showLineLabel
    }

    let dates = forceDates

    if (!dates) {
        const globalEnd = filter.value.date
        const timeframe = t.config?.timeframe || 'daily'
        let filterVal = t.filterValue
        let range = null

        if (filterVal === undefined) {
            const globalDefault = dataModel.value?.config?.defaultDateFilter
            if (globalDefault !== undefined && globalDefault !== null && !isNaN(Number(globalDefault))) {
                filterVal = Number(globalDefault)
                if (filterVal < 1 && timeframe === 'daily') filterVal = 1
            } else if (t.config?.timeframeDefaultValue !== undefined && t.config?.timeframeDefaultValue !== null) {
                filterVal = t.config.timeframeDefaultValue
            } else {
                if (timeframe === 'daily') filterVal = 7
                else if (timeframe === 'monthly') filterVal = 6
                else if (timeframe === 'yearly') filterVal = 1
            }
            t.filterValue = filterVal
        }

        range = buildRange(globalEnd, timeframe, filterVal)
        dates = unreactive(range)
        t.dates = dates
    }

    const req = {
        type: t.type,
        height: t.h * 50,
        title: t.title,
        dateFrom: dates.from,
        dateTo: dates.to,
        config: t.config,
    }

    if (!t.dataSource) t.dataSource = 'both'

    let dataApi: any = null
    t.loading = true
    await $api.post('dashboard-item', req).then((r: any) => dataApi = r.data || r)
    t.loading = false
    t.dataApi = dataApi
    t.dates = unreactive(dates)
    await renderHtmlItem(t)
}

const renderHtmlItem = async (t: any) => {
    const data: any = t.dataApi
    await nextTick()
    const el = widgetRefs.get(t.id)
    if (!el || !data) return

    const titleEl = el.previousElementSibling as HTMLElement
    if (titleEl && titleEl.classList.contains('dash-title')) {
        applyTitleStyles(titleEl, t.config?.title)
    }

    if (data.html) render(el, data.html)
    if (Array.isArray(data.charts) && window.Plotly) {
        data.charts.forEach((ch: any) => chartStore.set(ch.id, ch))
        renderStoredCharts(el, data.charts.map((c: any) => c.id), $q.screen, t)
    }
}

const renderStoredCharts = (containerEl: HTMLElement, chartIds: string[], screen: any, t: any) => {
    if (!window.Plotly) return

    chartIds.forEach((id) => {
        const originalCh = chartStore.get(id)
        if (!originalCh) return

        const target: any = containerEl.querySelector(`#${id}`)

        if (!target) {
            console.error('Target element untuk Plotly benar-benar tidak ditemukan di dalam:', containerEl)
            return
        }

        const ch = JSON.parse(JSON.stringify(originalCh))

        const timeframe = ch.meta?.timeframe || t?.config?.timeframe || 'daily'
        enhanceXAxisDensity(ch, timeframe, screen)
        getLayout(ch, screen)
        getConfig(ch)

        if (t.config?.chartStyles) {
            applyChartStyles(ch, t.config.chartStyles, screen, target)
        }

        void window.Plotly.newPlot(target, ch.data, ch.layout, ch.config)
    })
}

const showTable = (item: any) => {
    dialog.value.title = item.title ?? 'View Table'
    dialog.value.props = item?.dataApi?.rows
    dialog.value.show = true
}

const submitDate = async () => {
    await onRefresh()
}
</script>

<style lang="css" scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: auto;
  gap: 12px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }

  .dashboard-item {
    grid-column: auto !important;
    grid-row: auto !important;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
}
</style>