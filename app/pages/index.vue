<template>
  <q-page padding class="q-px-md q-py-sm">
    <general-spinner-loading v-if="loading" />
    <q-card v-else flat style="border-radius: 8px 0px 0px 0px" class="q-pa-sm">
      <div class="row items-center q-mb-md q-col-gutter-md">
        <div class="col-12 col-md-6 flex items-center">
          <div class="text-h6 text-weight-bold">{{ dataModel.name }}</div>
        </div>

        <div class="col-12 col-md-6 flex justify-end items-center">
          <q-btn 
            :loading="isSyncing"
            size="sm"
            icon="sync"
            color="primary"
            label="Sync Data"
            class="q-ma-sm"
            outline
            @click="handleSyncSheet"
          >
            <q-tooltip>Sync data from Google Sheets</q-tooltip>
          </q-btn>
          
          <q-btn size="sm" icon="event" color="primary" :label="labelYear" class="q-ma-sm">
            <q-menu cover anchor="top middle" ref="popupRef">
              <q-date minimal dense v-model="filter.year" default-view="Years" emit-immediately mask="YYYY" @update:model-value="submitYear">
                <div class="q-py-sm text-h6 text-center text-primary">{{ labelYear }}</div>
              </q-date>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-card>

    <div class="dashboard-grid">
      <div v-for="(item, i) in dataModel.widgets" :key="i" class="q-mb-sm widget dashboard-item"
        :style="getGridStyle(item)">
        <q-card flat bordered class="q-px-sm q-py-md relative-position">
          <q-skeleton v-if="item.loading"
            :height="`${item.h * 50 + (item.title ? item.config?.title?.fontsize || 17 : 0)}px`" />

          <template v-else>
            <div class="row items-center justify-between q-mb-sm">
              <div class="row items-center no-wrap">
                <div v-if="item.title" class="q-px-sm dash-title ellipsis text-subtitle2 text-weight-bold">
                  {{ item.title }}
                </div>
                <div class="q-pa-xs row q-gutter-sm no-wrap">
                  <q-btn flat round dense color="secondary" size="xs" icon="refresh" @click="fetchWidget(item)">
                    <q-tooltip>Refresh Widget</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <div class="row items-center q-gutter-sm q-px-sm">
                <q-btn size="sm" outline icon="event" color="primary" :label="getWidgetLabelYear(item)">
                  <q-menu cover anchor="top middle" :ref="(el: any) => { if (el) menuRefs[item.id] = el }">
                    <q-date minimal dense v-model="item._uiYear" default-view="Years" emit-immediately mask="YYYY"
                      @update:model-value="applyWidgetYear(item)">
                      <div class="q-py-sm text-subtitle1 text-center text-primary text-weight-bold">
                        {{ getWidgetLabelYear(item) }}
                      </div>
                    </q-date>
                  </q-menu>
                </q-btn>

                <q-btn
                  v-if="['basic_chart', 'donut_chart', 'bar_chart', 'waterfall_chart'].includes(item.type) && Array.isArray(item.config?.dataSource) && item.config.dataSource.length > 1"
                  size="sm"
                  outline
                  color="primary"
                  icon="layers"
                  :label="item._activeSource || item.config.dataSource[0]"
                  class="text-capitalize"
                >
                  <q-menu>
                    <div class="column q-pa-sm q-gutter-y-xs" style="min-width: 150px">
                      <div class="text-caption text-grey-8 q-px-xs q-pb-xs">Pilih Data Source</div>
                      <q-btn
                        v-for="src in item.config.dataSource"
                        :key="src"
                        :label="src"
                        :color="(item._activeSource || item.config.dataSource[0]) === src ? 'primary' : 'secondary'"
                        :flat="(item._activeSource || item.config.dataSource[0]) !== src"
                        size="sm"
                        align="left"
                        class="text-capitalize"
                        v-close-popup
                        @click="updateWidgetSource(item, src)"
                      />
                    </div>
                  </q-menu>
                </q-btn>

                <q-btn
                  v-if="item.type === 'project_summary' && item.config?.summaryTemplate === 'monitoring'"
                  size="sm"
                  outline
                  color="primary"
                  icon="person"
                  :label="`PIC: ${getWidgetFilterValue(item, 'pm') || 'All'}`"
                >
                  <q-menu>
                    <div class="column q-pa-sm q-gutter-y-xs" style="min-width: 150px">
                      <div class="text-caption text-grey-8 q-px-xs q-pb-xs">Select PIC</div>
                      <q-btn
                        v-for="pic in picOptions"
                        :key="pic"
                        :label="pic"
                        :color="(getWidgetFilterValue(item, 'pm') || 'All') === (pic) ? 'primary' : 'secondary'"
                        :flat="(getWidgetFilterValue(item, 'pm') || 'All') !== (pic)"
                        size="sm"
                        align="left"
                        v-close-popup
                        @click="updateWidgetFilter(item, 'pm', pic)"
                      />
                    </div>
                  </q-menu>
                </q-btn>
              </div>
            </div>

            <div :ref="(el: any) => setWidgetRef(el, item.id)" :id="item.id" @click="handleWidgetClick"></div>
          </template>
        </q-card>
      </div>
    </div>

    <general-dialog v-model="dialog">
      <dashboard-project-detail v-if="dialog.type == 'project'" :project="dialog.props" />
      <dashboard-summary-detail v-else-if="dialog.type == 'summary'" :project="dialog.props" />
    </general-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { enhanceXAxisDensity, getLayout, getConfig, applyChartStyles, applyTitleStyles } from '~/utils/chartHelper'
import { useQuasar } from 'quasar'

definePageMeta({
  layout: 'dashboard'
})

const dialog = ref<any>({
  show: false,
  type: 'project',
  title: 'Dialog',
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
const isSyncing = ref(false)

const currentYear = new Date().getFullYear()

const filter = ref<any>({
  year: currentYear.toString()
})

const labelYear = computed(() => {
  const y = filter.value.year
  if (!y) return 'Pilih Tahun'
  if (typeof y === 'string') return `Tahun: ${y}`
  if (y.from && y.to) {
    if (y.from === y.to) return `Tahun: ${y.from}`
    return `Tahun: ${y.from} - ${y.to}`
  }
  return 'Pilih Tahun'
})

const picOptions = ref<string[]>(['All'])
const chartStore = new Map<string, any>()
const widgetRefs = new Map<string, HTMLElement>()
const popupRef = ref<any>(null)
const menuRefs = ref<Record<string, any>>({})

const setWidgetRef = (el: HTMLElement | null, id: string) => {
  if (!el) return
  widgetRefs.set(id, el)
  registerPlotlyContainer(el)
}

const handleWidgetClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  const tabBtn = target.closest('[data-tab-btn]')
  if (tabBtn) {
    const targetId = tabBtn.getAttribute('data-tab-target')
    const hideId = tabBtn.getAttribute('data-tab-hide')

    if (targetId && hideId) {
      const targetEl = document.getElementById(targetId)
      const hideEl = document.getElementById(hideId)
      if (targetEl) targetEl.style.display = 'block'
      if (hideEl) hideEl.style.display = 'none'

      const parent = tabBtn.parentElement
      if (parent) {
        Array.from(parent.children).forEach(child => {
          child.classList.remove('bg-primary', 'text-white')
          child.classList.add('bg-white', 'text-grey-8')
        })
        tabBtn.classList.remove('bg-white', 'text-grey-8')
        tabBtn.classList.add('bg-primary', 'text-white')
      }
    }
    return
  }

  const statusCard = target.closest('.hoverable-card[data-status-summary]')
  if (statusCard) {
    const summaryStr = statusCard.getAttribute('data-status-summary')
    const statusName = statusCard.getAttribute('data-status-name')
    const cardType = statusCard.getAttribute('data-type') || 'installations'

    if (summaryStr) {
      try {
        const breakdownData = JSON.parse(decodeURIComponent(summaryStr))

        dialog.value.props = {
          title: statusName || 'Detail',
          data: breakdownData,
          status: statusName,
          type: cardType
        }
        dialog.value.title = `Detail ${cardType} - ${statusName}`
        dialog.value.type = 'summary'
        dialog.value.show = true
      } catch (e) {
        console.error('Failed to parse status summary data', e)
      }
    }
    return
  }

  const tr = target.closest('tr[data-row]')
  if (tr) {
    const rowDataStr = tr.getAttribute('data-row')
    if (rowDataStr) {
      try {
        const rowData = JSON.parse(decodeURIComponent(rowDataStr))

        if (rowData && (rowData.progressData || rowData.projectCode)) {
          dialog.value.props = rowData
          dialog.value.type = 'project'
          dialog.value.title = `${rowData?.projectName} (${rowData?.projectCode})`
          dialog.value.show = true
        }
      } catch (e) {
        console.error('Failed to parse row data from click', e)
      }
    }
  }
}

const handleSyncSheet = async () => {
  isSyncing.value = true
  try {    
    const response = await $fetch('/api/sheet')
    
    $q.notify({
      type: 'positive',
      message: (response as any).message || 'Sheet data synced successfully!',
      position: 'top',
      icon: 'check_circle'
    })

    await onRefresh()
  } catch (error: any) {
    console.error('Sync error:', error)
    $q.notify({
      type: 'negative',
      message: error.data?.message || error.message || 'Failed to sync sheet data',
      position: 'top',
      icon: 'warning'
    })
  } finally {
    isSyncing.value = false
  }
}

const onRefresh = async () => {
  if (dataModel.value.widgets && dataModel.value.widgets.length) {
    await Promise.all(dataModel.value.widgets.map((t: any) => fetchWidget(t)))
  }
}

const initWidgetYear = (item: any) => {
  const yearFilters = item?.config?.query?.filters?.filter((f: any) => f.name === 'year' && !f.isGlobalYear) || []
  if (yearFilters.length === 0) {
    item._uiYear = null // Fallback to global
  } else if (yearFilters.length === 1 && yearFilters[0].operator === '=') {
    item._uiYear = yearFilters[0].value.toString()
  } else if (yearFilters.length >= 2) {
    const from = yearFilters.find((f: any) => ['>=', '>'].includes(f.operator))?.value
    const to = yearFilters.find((f: any) => ['<=', '<'].includes(f.operator))?.value
    if (from && to) item._uiYear = { from: from.toString(), to: to.toString() }
  }
}

const getWidgetLabelYear = (item: any) => {
  const y = item._uiYear || filter.value.year
  if (!y) return 'Pilih Tahun'
  if (typeof y === 'string') return `Tahun: ${y}`
  if (y.from && y.to) {
    if (y.from === y.to) return `Tahun: ${y.from}`
    return `Tahun: ${y.from} - ${y.to}`
  }
  return 'Pilih Tahun'
}

const applyWidgetYear = async (item: any) => {
  if (menuRefs.value[item.id]) {
    menuRefs.value[item.id].hide()
  }

  const val = item._uiYear
  if (!item.config) item.config = {}
  if (!item.config.query) item.config.query = { filters: [] }

  item.config.query.filters = item.config.query.filters.filter((f: any) => f.name !== 'year')

  if (val) {
    if (typeof val === 'string') {
      item.config.query.filters.push({ name: 'year', operator: '=', value: Number(val), isGlobalYear: false })
    } else if (val.from && val.to) {
      item.config.query.filters.push({ name: 'year', operator: '>=', value: Number(val.from), isGlobalYear: false })
      item.config.query.filters.push({ name: 'year', operator: '<=', value: Number(val.to), isGlobalYear: false })
    }
  }

  await fetchWidget(item)
}

const getWidgetFilterValue = (item: any, filterName: string) => {
  if (!item?.config?.query?.filters) return null
  const filterParam = item.config.query.filters.find((f: any) =>
    String(f.name).toLowerCase() === filterName.toLowerCase() && !f.isGlobalYear
  )
  return filterParam ? filterParam.value : null
}

const updateWidgetFilter = async (item: any, filterName: string, value: any) => {
  if (!item.config) item.config = {}
  if (!item.config.query) item.config.query = { filters: [] }
  if (!item.config.query.filters) item.config.query.filters = []

  item.config.query.filters = item.config.query.filters.filter((f: any) => f.name !== filterName)

  if (value !== 'All') {
    item.config.query.filters.push({ name: filterName, operator: '=', value: value, isGlobalYear: false })
  }

  await fetchWidget(item)
}

const updateWidgetSource = async (item: any, newSource: string) => {
  const oldSource = item._activeSource || item.config.dataSource[0]
  if (oldSource === newSource) return
  item._activeSource = newSource

  if (item.config?.chart) {
    if (item.config.chart.x) {
      item.config.chart.x = item.config.chart.x.replace(oldSource, newSource)
    }
    
    if (item.config.chart.legend) {
      item.config.chart.legend = item.config.chart.legend.replace(oldSource, newSource)
    }
    
    if (item.config.chart.series && Array.isArray(item.config.chart.series)) {
      item.config.chart.series.forEach((s: any) => {
        if (s.field) {
          s.field = s.field.replace(oldSource, newSource)
        }
      })
    }
  }

  await fetchWidget(item)
}

const getGridStyle = (item: any) => {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
  }
}

const fetchDashboard = async () => {
  await $api.get('dashboard').then((res: any) => {
    const data = res.data || res
    if (data) {
      if (data.widgets && Array.isArray(data.widgets)) {
        data.widgets.forEach((w: any) => initWidgetYear(w))
      }
      dataModel.value = data
    }
  })
}

const fetchPms = async () => {
  await $api.get('procurements/pms').then((res: any) => {
    const data = res.data || res
    if (data) {
      picOptions.value = ['All', ...data]
    }
  })
}

const fetchWidget = async (t: any) => {
  if (!t.config) t.config = {}
  if (!t.config.chartStyles) t.config.chartStyles = {}
  if (!t.config.chartStyles.lineLabels) t.config.chartStyles.lineLabels = { show: true }

  if (!t.config.query) t.config.query = { filters: [] }
  if (!t.config.query.filters) t.config.query.filters = []

  t.config.query.filters = t.config.query.filters.filter((f: any) => !f.isGlobalYear)

  const hasLocalYearFilter = t.config.query.filters.some((f: any) => f.name === 'year' && !f.isGlobalYear)

  if (!hasLocalYearFilter && filter.value.year) {
    const y = filter.value.year
    if (typeof y === 'string') {
      t.config.query.filters.push({ name: 'year', operator: '=', value: Number(y), isGlobalYear: true })
    } else if (y && y.from && y.to) {
      t.config.query.filters.push({ name: 'year', operator: '>=', value: Number(y.from), isGlobalYear: true })
      t.config.query.filters.push({ name: 'year', operator: '<=', value: Number(y.to), isGlobalYear: true })
    }
  }

  const req = {
    type: t.type,
    height: t.h * 50 - 30,
    title: t.title,
    config: t.config,
  }

  if (!t.dataSource) t.dataSource = 'both'

  let dataApi: any = null
  t.loading = true
  await $api.post('widget', req).then((r: any) => dataApi = r.data || r)
  t.loading = false
  t.dataApi = dataApi
  await renderHtmlItem(t)
}

const renderHtmlItem = async (t: any) => {
  const data: any = t.dataApi
  await nextTick()
  const el = widgetRefs.get(t.id)
  if (!el || !data) return

  const container = el.parentElement?.parentElement
  if (container) {
    const titleEl = container.querySelector('.dash-title') as HTMLElement
    if (titleEl) {
      applyTitleStyles(titleEl, t.config?.title)
    }
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

const submitYear = async () => {
  popupRef.value?.hide()
  await onRefresh()
}

onMounted(async () => {
  loading.value = true

  if (typeof window === 'undefined') return
  if (!window.Plotly) {
    const mod = await import('plotly.js-dist-min')
    window.Plotly = mod.default
  }

  await Promise.all([fetchDashboard(), fetchPms()])
  loading.value = false

  await onRefresh()
})
</script>

<style lang="css">
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: auto;
  gap: 12px;
}

.hoverable-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.hoverable-row:hover {
  background-color: #e0f2fe !important;
}

.hoverable-card {
  transition: all 0.2s ease;
}

.hoverable-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #e0f2fe !important;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }

  .widget {
    grid-column: auto !important;
    grid-row: auto !important;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
}
</style>