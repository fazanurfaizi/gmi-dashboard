<!-- <template>
  <q-page padding class="q-px-md q-py-sm">
    <q-card flat style="border-radius: 8px 0px 0px 0px" class="q-pa-sm">
      <div class="row items-center q-mb-md q-col-gutter-md">
        <div class="col-12 col-md-6 flex items-center">
          <img src="~/assets/logo.png" width="42" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">{{ dataModel.name }}</div>
        </div>

        <div class="col-12 col-md-6 flex justify-end items-center">
          <q-btn size="sm" icon="event" color="secondary" :label="labelDate" class="q-ma-sm">
            <q-menu cover anchor="top middle">
              <q-date minimal dense v-model="filter.date" years-in-month-view emit-immediately mask="YYYY-MM-DD" event-color="red">
                <div class="q-py-sm text-h6 text-center text-primary">{{ labelDate }}</div>
                <q-separator inset />
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn label="Cancel" color="primary" flat v-close-popup />
                  <q-btn label="Apply Filter" color="primary" flat @click="submitDate" v-close-popup />
                </div>
              </q-date>
            </q-menu>
          </q-btn>

          <q-btn-dropdown v-if="dataModel?.config?.companyFilter?.show" color="secondary" :label="!project || project?.toLowerCase() == 'all' ? 'All Project' : project" class="q-mr-sm">
            <q-list>
              <q-item clickable v-for="(p, i) in projects" :key="i" v-close-popup @click="reloadData(p)">
                <q-item-section>{{ p }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
    </q-card>

    <div class="row">
      <div v-for="(col, i) in dataModel.renderCols" :key="i" :class="`q-pa-sm col-12 col-md-${col.w}`">
        <div v-for="(item, c) in col.items" :key="c" class="q-mb-sm">
          <q-card flat bordered class="q-px-sm q-py-md relative-position">
            <div v-if="!item.loading" class="absolute-top-right q-pa-xs row q-gutter-sm no-wrap">
              <FilterDateWidget v-if="chartDateIncludes.includes(item.type) && item.dates" v-model="col.items[c]" @on-filter="forceFilterDate" />
              <q-btn-dropdown
                v-if="['coal_getting_chart'].includes(item.type)"
                flat round dense color="secondary" size="xs" icon="filter_alt" auto-close
              >
                <q-list dense style="min-width: 100px">
                  <q-item clickable @click="updateDataSource(item, 'both')" :active="!item.dataSource || item.dataSource === 'both'">
                    <q-item-section>Both</q-item-section>
                  </q-item>
                  <q-item clickable @click="updateDataSource(item, 'rits')" :active="item.dataSource === 'rits'">
                    <q-item-section>Rits Only</q-item-section>
                  </q-item>
                  <q-item clickable @click="updateDataSource(item, 'survey')" :active="item.dataSource === 'survey'">
                    <q-item-section>Survey Only</q-item-section>
                  </q-item>
                </q-list>
                <q-tooltip>Filter Data Source</q-tooltip>
              </q-btn-dropdown>
              <q-btn v-if="tableIncludes.includes(item.type)" flat round dense color="secondary" size="xs" icon="table_chart" @click="showTable(item)">
                <q-tooltip>Show Raw Data Table</q-tooltip>
              </q-btn>
              <q-btn flat round dense color="secondary" size="xs" icon="refresh" @click="fetchWidget(item)">
                <q-tooltip>Refresh Widget</q-tooltip>
              </q-btn>
            </div>
            <q-skeleton v-if="item.loading" :height="`${item.h * 50 + 43}px`" />
            <template v-else>
              <div v-if="item.title" class="q-px-sm dash-title">{{ item.title }}</div>
              <div :ref="(el: any) => setWidgetRef(el, item.id)"></div>
            </template>
          </q-card>
        </div>
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
import { useAuthStore } from '~/stores/auth'
import { chartDateIncludes, tableIncludes } from '~/utils/dashboard-general/meta'
import { enhanceXAxisDensity, getLayout, getConfig, applyChartStyles, applyTitleStyles } from '~/utils/dashboard-general/chartHelper'
import { Helper } from '~/services/helper'
import { buildRange } from '~/utils/dashboard-general/dateHelper'
import { usePlotlyAutoResize } from '~/services/composables/usePlotlyAutoResize'
import { useQuasar } from 'quasar'
import { useSafeHtml } from '~/services/composables/useSafeHtml'
import { useApi } from '~/composables/useApi'
import FilterDateWidget from '~/components/dashboard-general/FilterDateWidget.vue'
import TableView from '~/components/dashboard-general/TableView.vue'
import type { Dialog } from '~/services/handler'

definePageMeta({
  layout: 'dashboard'
})

const dialog = ref<Dialog>({
  show: false,
  type: 'detail',
  title: 'Table Detail',
  props: null,
  maximize: false,
  persistent: false,
})
const { registerPlotlyContainer } = usePlotlyAutoResize()
const $api = useApi()
const route = useRoute()
const router = useRouter()
const Auth = useAuthStore()
const props = defineProps({
  code: { type: String, required: false },
})
const $q = useQuasar()
const { render } = useSafeHtml()

const dataModel = ref<any>({
  name: '',
  templates: [],
})
const projects = Auth.getCompanies()
const project = ref<string | null>(null)

const filter = ref<any>({
  date: Helper.today(),
  apiCompanies: null,
})

const labelDate = computed(() => {
  return Helper.readDate(filter.value.date)
})

const chartStore = new Map<string, any>()
const widgetRefs = new Map<string, HTMLElement>()

const setWidgetRef = (el: HTMLElement | null, id: string) => {
  if (!el) return
  widgetRefs.set(id, el)
  registerPlotlyContainer(el)
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  if (!window.Plotly) {
    const mod = await import('plotly.js-dist-min')
    window.Plotly = mod.default
  }

  const routeCode = Array.isArray(route.params?.code) ? route.params.code[0] : (route.params?.code ?? null)
  const dashboardCode = props?.code || routeCode
  await $api.get(`dashboard?code=${dashboardCode}`).then((res: any) => {
    const data = res.data || res
    if (data) {
      dataModel.value = data
      if (data?.config?.companyFilter?.show) {
        if (project.value == null && dataModel.value?.config?.companyFilter?.codes?.[0]) {
          project.value = dataModel.value.config.companyFilter.codes[0]
        }
      }
    }
  })
  await onRefresh()
})

const onRefresh = async () => {
  filter.value.apiCompanies = getSelectedCompanies()
  if (dataModel.value.renderCols && dataModel.value.renderCols.length) {
    await Promise.all(dataModel.value.renderCols.flatMap((col: any) => col.items.map((t: any) => fetchWidget(t))))
  }
}

const forceFilterDate = async (t: any) => {
  if (t.dates) await fetchWidget(t, t.dates)
}

const updateDataSource = (t: any, source: string) => {
  t.dataSource = source
  const el = widgetRefs.get(t.id)
  if (el && t.dataApi?.charts) {
    renderStoredCharts(el, t.dataApi.charts.map((c: any) => c.id), $q.screen, t)
  }
}

const fetchWidget = async (t: any, forceDates: any = null) => {
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
    dates = Helper.unreactive(range)
    t.dates = dates
  }

  const req = {
    type: t.type,
    height: t.h * 50,
    title: t.title,
    companyCodes: dataModel.value?.config?.companyFilter?.codes?.join(','),
    dateFrom: dates.from,
    dateTo: dates.to,
    config: t.config,
  }

  if (dataModel.value?.config?.companyFilter?.show) {
    req.companyCodes = filter.value.apiCompanies
  }

  if (!t.dataSource) t.dataSource = 'both'

  let dataApi: any = null
  t.loading = true
  await $api.post('dashboard-item', req).then((r: any) => dataApi = r.data || r)
  t.loading = false
  t.dataApi = dataApi
  t.dates = Helper.unreactive(dates)
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
    if (!target) return

    const ch = JSON.parse(JSON.stringify(originalCh))

    if (['coal_getting_chart', 'coal_getting_group_company'].includes(t.type)) {
      const source = t.dataSource || 'both'
      if (source !== 'both' && Array.isArray(ch.data)) {
        ch.data = ch.data.filter((trace: any) => {
          const name = (trace.name || '').toLowerCase()
          if (source === 'rits') return !name.includes('survey')
          if (source === 'survey') return !name.includes('rits')
          return true
        })
        if (ch.layout?.annotations) ch.layout.annotations = []
      }
    }

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

const reloadData = async (p: string) => {
  project.value = p
  await onRefresh()
}

const getSelectedCompanies = () => {
  if (project.value === null || project.value?.toLowerCase() == 'all') {
    return projects.filter((p) => p !== null).join(',')
  }
  return project.value
}

watch(
  () => route.params.code,
  (newVal, oldVal) => {
    if (newVal !== oldVal) router.go(0)
  }
)
</script>

<style lang="css" scoped>
/* Scoped styles converted successfully */
</style> -->

<template>
  <h1>DINDA</h1>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()

// When accessing /posts/1, route.params.id will be 1
console.log(route.params.code)
</script>