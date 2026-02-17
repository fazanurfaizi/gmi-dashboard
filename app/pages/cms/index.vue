<template>
  <q-page padding>
    <spinner-loading v-if="loading" />
    <q-form v-else @submit="submit">
      <div class="row">
        <Card title="General Info" col="12" use-top-section>
          <template #top-section-right>
            <q-btn color="primary" label="Apply" type="button" @click="apply()" />
          </template>
          
          <q-input v-model="dataModel.code" label="Code" readonly />
          <q-input v-model="dataModel.name" label="Name" readonly />
        </Card>
      </div>

      <div class="row">
        <div class="col-12">
          <q-card flat style="border-radius: 8px 0px 0px 0px" class="q-pa-sm">
            <div class="flex justify-end items-center q-gutter-sm">
              <q-btn-dropdown color="primary" label="Add Widget">
                <q-list dense>
                  <q-item-label caption class="q-mx-sm q-my-sm text-uppercase text-bold">Custom</q-item-label>
                  <q-item v-for="item in widgetOptions" :key="item.type" clickable @click="add(item.type)">
                    <q-item-section avatar>
                      <q-icon :name="getIcon(item.type)" color="grey-7" />
                    </q-item-section>
                    <q-item-section>{{ item.label }}</q-item-section>
                  </q-item>
                  <q-separator />
                </q-list>
              </q-btn-dropdown>
            </div>
          </q-card>
          <client-only>
            <div ref="gridContainer" class="grid-stack bg-grey-2"></div>
          </client-only>
        </div>
      </div>
    </q-form>

    <q-dialog v-model="dialog.show" :persistent="dialog.persistent">
      <q-card style="min-width: 600px; max-width: 90vw;">
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>{{ dialog.title }}</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>

        <q-card-section v-if="currentWidget">
          <FormTable v-if="currentWidget.type == 'table'" v-model="currentWidget"
            @submit="updateWidget" />
          <FormChart v-else v-model="currentWidget"
            @submit="updateWidget" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { Meta } from './meta'
import { useQuasar } from 'quasar'
import type { Dashboard, WidgetData } from '~~/types/dashboard'
import { initGrid, addWidget, getWidget, updateWidgetContent, removeWidget, removeAllWidget, getLayout } from '~/utils/gridstack'

definePageMeta({
  layout: 'cms'
})

const $api = useApi()
const $alert = useAlert()
const $q = useQuasar()

const dialog = ref<any>({
  show: false,
  type: 'form',
  title: 'Form',
  props: null,
  maximize: true,
  persistent: true,
})

const loading = ref(true)
const hasEdit = ref(false)
const dataModel = ref<Dashboard>(Meta.model)

const activeTab = ref<string | null>('general')

const currentWidget = ref<WidgetData>()

const gridContainer = ref<HTMLElement | null>(null)
const widgets = ref<any[]>([])

const COLORS = { RED: '#D32F2F', GREEN: '#388E3C', BLUE: '#1976D2', Rain: '#87c556', Plan: '#FC0000', Default: ['#0097A7', '#7B1FA2', '#C2185B'] }

const widgetOptions = [
  { label: 'Add Chart', type: 'combine_chart' },
  { label: 'Add Waterfall', type: 'waterfall_chart' },
  { label: 'Add Area Chart', type: 'area_chart' },
  { label: 'Add Donut Chart', type: 'donut_chart' },
  { label: 'Add Sparkline Chart', type: 'sparkline_chart' },
  { label: 'Add Achievement Card', type: 'achievement_card' },
  { label: 'Add Table', type: 'table' },

]

const init = async () => {
  widgets.value = []

  dataModel.value = unreactive({
    ...Meta.model,
  })

  await getData(1)
}

const getData = async (id: string | number) => {
  loading.value = true
  try {
    const res: any = await $api.get(`${Meta.module}/${id}`)
    loading.value = false
    const data = res.data || res
    if (data) {
      dataModel.value = data
      nextTick(() => {
        if (gridContainer.value) {
          initGrid(gridContainer.value)

          if (data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) 
            loadSavedWidgets(data.widgets)
        }
      })
    }
  } catch (e) {
    loading.value = false
    console.error(e)
    nextTick(() => {
      if (gridContainer.value) initGrid(gridContainer.value) 
    })
  }
}

const loadSavedWidgets = (widgets: any[]) => {
  removeAllWidget()
  widgets.forEach((t) => {
    const w = addWidget(t)
    if (w) {
      const newWidget = { ...t, ...w }
      upsertWidget(newWidget)
      void updateWidget(newWidget)
    }
  })
}

const apply = async () => {
  if (hasEdit.value) await submit()
  hasEdit.value = false
}

const submit = async () => {
  if (validateSubmit()) {
    $alert.loadingOverlay(true, 'Saving...')
    let status = 600
    dataModel.value.widgets = getLayout()
    try {
      if (dataModel.value.id) status = await update()
      else status = await save()
      
      if (status === 200 || status === 201) {
        $alert.showSuccess('Data has been successfully saved.')
      }
    } catch (e: any) {
      $alert.showError('Save Error', e)
    } finally {
      $alert.loadingOverlay(false)
    }
  }
}

const validateSubmit = () => { return true }

const save = async () => {
  let statusapi = 600
  const res: any = await $api.post(Meta.module, dataModel.value)
  if (res) statusapi = 200
  return statusapi
}

const update = async () => {
  let statusapi = 600
  const res: any = await $api.put(`${Meta.module}/${dataModel.value.id}`, dataModel.value)
  if (res) statusapi = 200
  return statusapi
}

function add(type: string) {
  hasEdit.value = true
  addNewWidget({
    type: type,
    title: type.replaceAll('_', ' ').toUpperCase(),
    config: {
      app: null, endpoint: null, query: { limit: 0, order: 'createdAt:DESC', filters: [], applyFilterExactDateEnd: false },
      company: null, applyFilterCompany: true, columns: [],
      additionalAxes: [ { show: false, type: 'line', name: 'plan', color: COLORS.Plan }, { show: false, type: 'line', name: 'rain', color: COLORS.Rain } ],
      colorSeries: [],
      chart: { type: 'column', x: null, series: [], legend: null, options: { layout: { height: 420, margin: { l: 50, r: 40, t: 30, b: 60 } }, config: { responsive: true, displayModeBar: false } } },
      chartStyles: { xaxis: { show: true, fontsize: 10 }, yaxis: { show: true, fontsize: 10 }, y2axis: { show: false, fontsize: 10 }, legend: { show: true, position: 'top', fontsize: 11 }, labels: { show: true, position: 'auto', fontsize: 10 }, lineLabels: { show: true, fontsize: 10 }, options: { barMode: 'group', lineDash: 'solid' } },
      showLineLabel: true,
    },
  } as WidgetData)
}

function upsertWidget(data: any) {
  const index = widgets.value.findIndex((w) => w.id === data.id)
  if (index !== -1) widgets.value[index] = { ...widgets.value[index], ...data }
  else widgets.value.push(data)
}

function addNewWidget(data: any) {
  const w = addWidget(data)
  if (w) {
    const newWidget = { ...data, ...w }
    upsertWidget(newWidget)
    updateWidget(newWidget)
  }
}

function editWidget(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  const target = w ? w : getWidget(id)
  if (target) {
    currentWidget.value = JSON.parse(JSON.stringify(target))
    if (!currentWidget.value!.config) currentWidget.value!.config = {} as any
    if (!currentWidget.value!.config.title) currentWidget.value!.config.title = { align: 'left' }
    if (!currentWidget.value!.config.additionalAxes) currentWidget.value!.config.additionalAxes = [ { show: false, type: 'line', name: 'plan', color: COLORS.Plan }, { show: false, type: 'line', name: 'rain', color: COLORS.Rain } ]
    if (!currentWidget.value!.config.colorSeries || currentWidget.value!.config.colorSeries.length === 0) currentWidget.value!.config.colorSeries = []
    if (currentWidget.value!.config.timeframeDefaultValue === undefined) currentWidget.value!.config.timeframeDefaultValue = null
    if (!currentWidget.value!.config.chartStyles) currentWidget.value!.config.chartStyles = { xaxis: { show: true, fontsize: 10 }, yaxis: { show: true, fontsize: 10 }, y2axis: { show: false, fontsize: 10 }, legend: { show: true, position: 'top', fontsize: 11 }, labels: { show: true, position: 'auto', fontsize: 10 }, lineLabels: { show: true, fontsize: 10 }, options: { barMode: 'group', lineDash: 'solid' } }
    activeTab.value = null    
  }
  dialog.value.show = true
}

const updateWidget = (payload: any) => {
  hasEdit.value = true
  const savedWidget = widgets.value.find((w) => w.id === payload.id)
  if (!savedWidget) return
  const mergedData = { ...savedWidget, ...payload }
  upsertWidget(mergedData)
  updateWidgetContent(payload)
  dialog.value.show = false
}

function getIcon(type: string) {
  const map: Record<string, string> = { combine_chart: 'bar_chart', dashboard2: 'equalizer', waterfall_chart: 'waterfall_chart', dashboard4: 'area_chart', sparkline_chart: 'show_chart', achievementCard: 'military_tech', inventory: 'table_view', stockMovement: 'fast_forward', coalGettingWidget: 'stacked_bar_chart' }
  return map[type] || 'widgets'
}

watch(
  () => loading,
  () => {
    if (loading.value) $q.loading.show()
  }
)

onMounted(async () => {
  if (process.server) return

  if (!window.Plotly) {
    const mod = await import('plotly.js-dist-min')
    window.Plotly = mod.default
  }

  Object.assign(window, { editWidget, updateWidget, removeWidget })

  init()
})
</script>