<template>
  <q-card flat class="bg-transparent">
    <q-form @submit="updateData()">
      
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6 text-weight-bold text-grey-8">Chart Configuration</div>
        <div class="row q-gutter-sm">
          <q-btn label="Cancel" flat v-close-popup color="grey-7" />
          <q-btn type="submit" color="primary" icon="save" label="Update Widget" unelevated />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-card bordered flat>
            <q-card-section>
              <div class="text-subtitle2 text-weight-bold text-grey-7 q-mb-sm">General & Data Source</div>
              
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input v-model="dataModel.title" label="Widget Title" outlined dense placeholder="Enter chart title..." />
                </div>

                <div class="col-12 col-md-6">
                  <template v-if="!loading">
                    <q-input 
                      v-model="dataModel.config.spreadsheetId" 
                      label="Speadhsheet ID"                       
                      outlined dense
                    />
                  </template>
                  <q-skeleton v-else type="QInput" />
                </div>

                <div class="col-12 col-md-6">
                  <template v-if="!loading">
                    <q-input 
                      v-model="dataModel.config.sheetName" 
                      label="Sheet Name" 
                      @update:modelValue="getColumns()" 
                      outlined dense
                    />
                  </template>
                  <q-skeleton v-else type="QInput" />
                </div>                
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12">
          <q-card bordered flat>
            <q-tabs
              v-model="tab"
              dense
              class="text-grey"
              active-color="primary"
              indicator-color="primary"
              align="justify"
              narrow-indicator
            >
              <q-tab name="columns" icon="view_column" label="Columns" />
              <q-tab name="query" icon="filter_alt" label="Query / Filter" />
              <q-tab name="chart" icon="insert_chart" label="Chart Settings" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated class="q-pa-none">
              
              <q-tab-panel name="columns" class="q-pa-none">
                <div class="q-pa-md">
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2">Selected Columns</div>
                  </div>

                  <q-markup-table flat bordered dense wrap-cells separator="cell">
                    <thead class="bg-grey-1">
                      <tr>
                        <MarkupTableThInput>Action</MarkupTableThInput>
                        <MarkupTableThInput>ID</MarkupTableThInput>
                        <MarkupTableThInput>Label</MarkupTableThInput>
                        <MarkupTableThInput>Format</MarkupTableThInput>
                        <MarkupTableThInput>Precision</MarkupTableThInput>
                        <MarkupTableThInput>Aggregation</MarkupTableThInput>
                        <MarkupTableThInput>Filter Date</MarkupTableThInput>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(v, i) in dataModel.config.columns" :key="i">
                        <td class="text-center" style="width: 50px">
                          <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delColumn(v, i)" />
                        </td>
                        <td class="bg-grey-1 text-grey-7">{{ v.id = `${v.name}${i}` }}</td>
                        <MarkupTableTdInput :i="i" v-model="v.label" type="input" dense borderless />
                        <MarkupTableTdInput :i="i" v-model="v.format" type="select" :options="optFormat" dense borderless />
                        <MarkupTableTdInput v-if="v.format == 'number'" :i="i" v-model="v.precision" type="number" :precision="0" dense borderless />
                        <td v-else class="bg-grey-2"></td>
                        <MarkupTableTdInput v-if="v.format" :i="i" v-model="v.aggregation" type="select" :options="optAggregation[v.format]" dense borderless />
                        <MarkupTableTdInput v-if="['date', 'datetime'].includes(v.format)" :i="i" v-model="v.datefilter" type="checkbox" dense borderless />
                        <td v-else class="bg-grey-2"></td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>

                <q-separator />

                <div class="q-pa-md">
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2">Preview Source Data</div>
                    <q-btn flat dense icon="refresh" label="Refresh Schema" size="sm" color="primary" @click="getColumns()" />
                  </div>
                  
                  <div class="scroll" style="max-height: 300px">
                    <q-markup-table flat bordered dense separator="cell">
                      <thead class="bg-grey-1">
                        <tr>
                          <th v-for="col in rawData.cols" :key="col.name" class="text-left">
                            <div class="row items-center no-wrap">
                              <span>{{ col.name }}</span>
                              <q-btn flat dense round icon="add_circle" color="positive" size="xs" class="q-ml-xs" @click="addColumn(col)">
                                <q-tooltip>Add to Columns</q-tooltip>
                              </q-btn>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody v-if="loadColumns">
                        <tr>
                          <td :colspan="rawData.cols?.length || 1" class="text-center q-pa-md">
                            <q-spinner color="primary" size="2em" />
                          </td>
                        </tr>
                      </tbody>
                      <tbody v-else>
                        <tr v-for="(r, idx) in rawData.rows" :key="idx">
                          <td v-for="col in rawData.cols" :key="col.name">{{ r[col.id] }}</td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="query">
                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model="dataModel.config.query.limit" label="Limit Results" outlined dense type="number" hint="Set 0 to view All" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model="dataModel.config.query.order" label="Order By" outlined dense placeholder="e.g., name:ASC" />
                  </div>
                </div>
                
                <q-separator class="q-my-md" />
                
                <ConfigChartQueryFilter 
                  v-model="dataModel.config.query.filters" 
                  :columns="rawData.cols" 
                  :operator-options="opt.queries" 
                />
              </q-tab-panel>

              <q-tab-panel name="chart">
                <div class="row q-col-gutter-md q-mb-lg">
                  <div class="col-12 col-md-4">
                    <q-select 
                      v-model="dataModel.config.chart.type" 
                      label="Chart Type" 
                      :options="['scatter', 'line', 'column', 'bar', 'area', 'pie']" 
                      outlined dense options-dense 
                    />
                  </div>
                  <div class="col-12 col-md-4" v-if="dataModel.config.chart.type !== 'pie'">
                    <q-select 
                      v-model="dataModel.config.chart.x" 
                      label="X Axis Source" 
                      :options="dataModel.config.columns" 
                      :optionLabel="(v: any) => `${v.label} (${v.id})`" 
                      option-value="id" 
                      outlined dense options-dense 
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select 
                      v-model="dataModel.config.chart.legend" 
                      label="Legend Source" 
                      :options="dataModel.config.columns" 
                      :optionLabel="(v: any) => `${v.label} (${v.id})`" 
                      option-value="id" 
                      outlined dense options-dense 
                    />
                  </div>
                </div>

                <div class="text-subtitle2 q-mb-sm row justify-between items-center">
                  <span>Series Configuration</span>
                  <q-btn flat dense icon="add" label="Add Series" color="primary" size="sm" @click="addSeries()" />
                </div>

                <q-markup-table flat bordered dense wrap-cells separator="cell">
                  <thead class="bg-grey-1">
                    <tr>
                      <th style="width: 50px">Action</th>
                      <MarkupTableThInput>Field</MarkupTableThInput>
                      <MarkupTableThInput>Axis</MarkupTableThInput>
                      <MarkupTableThInput>Type</MarkupTableThInput>
                      <MarkupTableThInput>Mode</MarkupTableThInput>
                      <MarkupTableThInput>Fill</MarkupTableThInput>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(v, i) in dataModel.config.chart.series" :key="i">
                      <td class="text-center">
                        <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delSeries(i)" />
                      </td>
                      <MarkupTableTdInput :i="i" v-model="v.field" type="select" :options="dataModel.config.columns" :optionLabel="(v: any) => `${v.label} (${v.id})`" option-value="id" dense borderless />
                      <MarkupTableTdInput :i="i" v-model="v.axis" type="select" :options="['y', 'y2']" dense borderless />
                      <MarkupTableTdInput :i="i" v-model="v.type" type="select" :options="['auto', 'scatter', 'line', 'column', 'area']" dense borderless />
                      <MarkupTableTdInput v-if="v.type !== 'column'" :i="i" v-model="v.mode" type="select" :options="['lines', 'markers', 'text', 'lines+markers', 'lines+text', 'markers+text', 'lines+markers+text']" dense borderless />
                      <td v-else class="bg-grey-2" />
                      <MarkupTableTdInput v-if="v.type === 'area'" :i="i" v-model="v.fill" type="select" :options="['none', 'tozeroy', 'tonexty']" dense borderless />
                      <td v-else class="bg-grey-2" />
                    </tr>
                  </tbody>
                </q-markup-table>
              </q-tab-panel>

            </q-tab-panels>
          </q-card>
        </div>
      </div>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { Meta } from '~/utils/meta'
import type { WidgetData } from '~~/types/dashboard';

useResizableTh()
useRowKeyboardMove()

const props = defineProps<{ modelValue: WidgetData }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const $api = useApi()
const loading = ref(true)
const loadColumns = ref(false)
const tab = ref('columns')
const tabs = ['columns', 'query', 'chart']
const dataModel = ref<WidgetData>(props.modelValue)
const rawData = ref<any>({ cols: [], rows: [] })
const opt = ref<{ modules: any; queries: { text: any; nontext: any } }>({ modules: [], queries: { text: [], nontext: [] } })
const optFormat = ['number', 'date', 'datetime', 'text']
const optAggregation: any = { number: ['', 'count', 'sum', 'avg', 'min', 'max'], date: ['', 'count', 'min', 'max'], datetime: ['', 'count', 'min', 'max'], text: ['', 'count'] }

const getOpt = async (ep: string) => {
  try {
    const res: any = await $api.get(ep)
    if (res && res.status === 200) {
      opt.value = res.data || res
    }
  } catch (e) {
    console.error('Failed to get options', e)
  }
}

const getColumns = async () => {
  const app = dataModel.value?.config.app
  const ep = dataModel.value?.config.endpoint
  if (!app || !ep) return
  loadColumns.value = true
  
  try {
    const res: any = await $api.get(`${ep}?limit=5`)
    loadColumns.value = false
    const d = res.data || res // Handle wrapper
    if (d && Array.isArray(d) && d.length > 0) {
      const cols = []
      const row = d[0]
      for (const key of Object.keys(row)) {
        if (!key) continue
        cols.push({ id: key, name: key, format: getFormat(row[key]) })
      }
      rawData.value.cols = cols
      rawData.value.rows = d
    }
  } catch (e) {
    loadColumns.value = false
    console.error('Failed to get columns', e)
  }
}

const addColumn = (v: any) => {
  if (!dataModel.value.config.columns) dataModel.value.config.columns = []
  dataModel.value.config.columns.push({ id: v.id, name: v.name, label: v.name, format: v.format, precision: null, aggregation: null, datefilter: false })
}

const delColumn = (_v: any, i: number) => { if (dataModel.value.config.columns) dataModel.value.config.columns.splice(i, 1) }

const addSeries = () => {
  if (!dataModel.value.config?.chart?.series) dataModel.value.config.chart.series = []
  dataModel.value.config.chart.series.push({ field: null, axis: 'y', type: 'auto' })
}

const delSeries = (i: number) => { if (dataModel.value.config?.chart?.series) dataModel.value.config.chart.series.splice(i, 1) }

const updateData = () => {
  emit('update:modelValue', dataModel.value)
  emit('submit', dataModel.value)
}

const getFormat = (val: any): string => {
  if (val === null || val === undefined) return 'text'
  if (typeof val === 'number') return 'number'
  if (val instanceof Date) return 'datetime'
  if (typeof val === 'string') {
    if (!isNaN(Date.parse(val)) && val.includes('T')) return 'datetime'
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'date'
    if (!isNaN(Number(val))) return 'number'
  }
  return 'text'
}

const moduleApp = computed(() => dataModel.value?.config?.app ? opt.value.modules[dataModel.value?.config?.app] : [])

onMounted(async () => {
  // await getOpt(`${Meta.module}?opt=true`)
  getColumns()
  loading.value = false
})
</script>