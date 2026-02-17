<template>
  <q-card flat class="bg-transparent">
    <q-form @submit="submit">
      
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6 text-weight-bold text-grey-8">Sheet Widget Configuration</div>
        <div class="row q-gutter-sm">
          <q-btn label="Cancel" flat v-close-popup color="grey-7" />
          <q-btn type="submit" color="primary" icon="save" label="Update Widget" unelevated />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <q-card bordered flat>
            <q-card-section>
              <div class="text-subtitle2 text-weight-bold text-grey-7 q-mb-sm">General & Data Source</div>
              
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-input v-model="dataModel.title" label="Widget Title" outlined dense />
                </div>
                <div class="col-12 col-md-4">
                  <q-select 
                    v-model="dataModel.type" 
                    label="Widget Type" 
                    :options="widgetTypeOptions" 
                    emit-value map-options
                    outlined dense 
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-item tag="label" class="q-pa-none bg-grey-1 rounded-borders q-px-md" v-ripple>
                    <q-item-section>
                      <q-item-label>Exact Date Only</q-item-label>
                      <q-item-label caption>Disable date range filtering</q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-toggle v-model="dataModel.config.query.applyFilterExactDateEnd" color="primary" />
                    </q-item-section>
                  </q-item>
                </div>

                <div class="col-12 col-md-5">
                  <q-input 
                    v-model="dataModel.config.spreadsheetId" 
                    label="Spreadsheet ID" 
                    outlined dense 
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjGMFR9..."
                    hint="The long ID string in the Google Sheet URL"
                  />
                </div>
                <div class="col-12 col-md-5">
                  <q-input 
                    v-model="dataModel.config.sheetName" 
                    label="Sheet Name" 
                    outlined dense 
                    placeholder="Sheet1" 
                  />
                </div>
                <div class="col-12 col-md-2 flex flex-center">
                  <q-btn 
                    label="Load Schema" 
                    color="secondary" 
                    icon="cloud_download" 
                    unelevated 
                    class="full-width"
                    :loading="loadingSchema"
                    @click="fetchColumns" 
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md">
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
              <q-tab v-if="!isTable" name="chart" icon="insert_chart" label="Chart Settings" />
              <q-tab v-if="!isTable" name="style" icon="palette" label="Styles" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated class="q-pa-none">
              
              <q-tab-panel name="columns" class="q-pa-none">
                <div class="q-pa-md">
                  <q-markup-table flat bordered dense wrap-cells separator="cell">
                    <thead class="bg-grey-1">
                      <tr>
                        <th style="width: 50px">Action</th>
                        <MarkupTableThInput>Field ID</MarkupTableThInput>
                        <MarkupTableThInput>Label</MarkupTableThInput>
                        <MarkupTableThInput>Format</MarkupTableThInput>
                        <MarkupTableThInput>Precision</MarkupTableThInput>
                        <MarkupTableThInput>Aggregation</MarkupTableThInput>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(v, i) in dataModel.config.columns" :key="i">
                        <td class="text-center">
                          <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delColumn(i)" />
                        </td>
                        <td class="bg-grey-1 text-grey-7">{{ v.name }}</td>
                        <MarkupTableTdInput :i="i" v-model="v.label" />
                        <MarkupTableTdInput :i="i" v-model="v.format" type="select" :options="optFormat" />
                        <MarkupTableTdInput v-if="v.format === 'number'" :i="i" v-model="v.precision" type="number" :precision="0" />
                        <td v-else class="bg-grey-2"></td>
                        <MarkupTableTdInput v-if="v.format" :i="i" v-model="v.aggregation" type="select" :options="optAggregation[v.format]" />
                        <td v-else class="bg-grey-2"></td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
                
                <q-separator />
                
                <div class="q-pa-md">
                  <div class="text-subtitle2 q-mb-xs">Available Columns (From Sheet)</div>
                  <div class="scroll" style="max-height: 250px">
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
                      <tbody>
                         <tr v-if="loadingSchema"><td :colspan="rawData.cols.length || 1" class="text-center"><q-spinner color="primary"/></td></tr>
                         <tr v-for="(r, idx) in rawData.rows" :key="idx">
                           <td v-for="col in rawData.cols" :key="col.name">{{ r[col.name] }}</td>
                         </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="query">
                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model.number="dataModel.config.query.limit" label="Limit Results" outlined dense type="number" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model="dataModel.config.query.order" label="Order By (e.g. date:DESC)" outlined dense />
                  </div>
                </div>
                <q-separator class="q-my-md" />
                <ConfigChartQueryFilter 
                  v-model="dataModel.config.query.filters" 
                  :columns="rawData.cols" 
                />
              </q-tab-panel>

              <q-tab-panel name="chart" v-if="!isTable">
                
                <div class="row q-col-gutter-md q-mb-lg">
                  <div class="col-12 col-md-6">
                     <q-select 
                      v-model="dataModel.config.chart.x" 
                      label="X-Axis / Category Field" 
                      :options="dataModel.config.columns" 
                      :optionLabel="(v) => v.label || v.name" 
                      option-value="name" 
                      outlined dense map-options emit-value
                    />
                  </div>
                  <div class="col-12 col-md-6" v-if="isDonut">
                     <q-select 
                      v-model="dataModel.config?.chart?.series[0]?.field" 
                      label="Value Field" 
                      :options="dataModel.config.columns" 
                      :optionLabel="(v) => v.label || v.name" 
                      option-value="name" 
                      outlined dense map-options emit-value
                    />
                  </div>
                  <div class="col-12 col-md-6" v-if="!isDonut && !isSparkline">
                    <q-select 
                      v-model="dataModel.config.chart.legend" 
                      label="Legend / Grouping Field" 
                      :options="dataModel.config.columns" 
                      :optionLabel="(v) => v.label || v.name" 
                      option-value="name" 
                      outlined dense map-options emit-value
                      clearable
                    />
                  </div>
                </div>

                <div v-if="!isDonut">
                  <div class="text-subtitle2 q-mb-sm row justify-between items-center">
                    <span>Series Configuration</span>
                    <q-btn flat dense icon="add" label="Add Series" color="primary" size="sm" @click="addSeries" />
                  </div>

                  <q-markup-table flat bordered dense wrap-cells separator="cell">
                    <thead class="bg-grey-1">
                      <tr>
                        <th style="width: 50px"></th>
                        <MarkupTableThInput>Field (Y-Axis)</MarkupTableThInput>
                        <template v-if="isCombine">
                          <MarkupTableThInput>Axis</MarkupTableThInput>
                          <MarkupTableThInput>Type</MarkupTableThInput>
                          <MarkupTableThInput>Mode</MarkupTableThInput>
                        </template>
                         <template v-if="isWaterfall">
                          <MarkupTableThInput>Type (Relative/Total)</MarkupTableThInput>
                        </template>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(v, i) in dataModel.config.chart.series" :key="i">
                        <td class="text-center">
                          <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delSeries(i)" />
                        </td>
                        
                        <MarkupTableTdInput 
                          :i="i" v-model="v.field" type="select" 
                          :options="dataModel.config.columns" 
                          :optionLabel="(col: any) => col.label || col.name" 
                          option-value="name" 
                        />

                        <template v-if="isCombine">
                          <MarkupTableTdInput :i="i" v-model="v.axis" type="select" :options="['y', 'y2']" />
                          <MarkupTableTdInput :i="i" v-model="v.type" type="select" :options="['column', 'line', 'area', 'scatter']" />
                          <MarkupTableTdInput v-if="v.type !== 'column'" :i="i" v-model="v.mode" type="select" :options="['lines', 'lines+markers', 'markers']" />
                          <td v-else class="bg-grey-2" />
                        </template>

                        <template v-if="isWaterfall">
                           <MarkupTableTdInput :i="i" v-model="v.mode" type="select" :options="['relative', 'total']" />
                        </template>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </q-tab-panel>

              <q-tab-panel name="style" v-if="!isTable">
                 <ConfigChartChartStyle v-model="dataModel.config.chartStyles" />
              </q-tab-panel>

            </q-tab-panels>
          </q-card>
        </div>
      </div>

    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import type { WidgetData } from '~~/types/dashboard'
import { useApi } from '~/composables/useApi'
import { useResizableTh } from '~/composables/useResizableTh'
import { useRowKeyboardMove } from '~/composables/useRowKeyboardMove'

useResizableTh()
useRowKeyboardMove()

const props = defineProps<{ modelValue: WidgetData }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const $api = useApi()
const tab = ref('columns')
const loadingSchema = ref(false)

// Initialize model with defaults if missing
const dataModel = ref<WidgetData>(JSON.parse(JSON.stringify(props.modelValue)))

// Ensure nested config objects exist
if (!dataModel.value.config) dataModel.value.config = { query: { filters: [] }, columns: [], chart: { series: [] } } as any
if (!dataModel.value.config.query) dataModel.value.config.query = { limit: 0, order: '', filters: [] }
if (!dataModel.value.config.chart) dataModel.value.config.chart = { type: 'column', series: [], x: null, legend: null }
if (!dataModel.value.config.chart.series) dataModel.value.config.chart.series = []

// Helper for Widget Types
const widgetTypeOptions = [
  { label: 'Combine Chart (Bar/Line/Area)', value: 'combine_chart' },
  { label: 'Donut Chart', value: 'donut_chart' },
  { label: 'Waterfall Chart', value: 'waterfall_chart' },
  { label: 'Sparkline', value: 'sparkline_chart' },
  { label: 'Table / Inventory', value: 'inventory' }
]

const isTable = computed(() => dataModel.value.type === 'inventory' || dataModel.value.type === 'table')
const isCombine = computed(() => ['combine_chart', 'bar_chart', 'area_chart'].includes(dataModel.value.type))
const isWaterfall = computed(() => dataModel.value.type === 'waterfall_chart')
const isDonut = computed(() => dataModel.value.type === 'donut_chart')
const isSparkline = computed(() => dataModel.value.type === 'sparkline_chart')

// Raw Data for Preview
const rawData = ref<{ cols: any[], rows: any[] }>({ cols: [], rows: [] })

// Options for Columns
const optFormat = ['text', 'number', 'date', 'datetime']
const optAggregation: Record<string, string[]> = {
  number: ['', 'sum', 'avg', 'min', 'max', 'count'],
  date: ['', 'min', 'max', 'count'],
  datetime: ['', 'min', 'max', 'count'],
  text: ['', 'count']
}

// Fetch Columns from Sheet API
const fetchColumns = async () => {
  const { spreadsheetId, sheetName } = dataModel.value.config
  if (!spreadsheetId) return

  loadingSchema.value = true
  try {
    // Call server/api/sheet.ts
    const res: any = await $api.get('/api/sheet')
    // const res: any = await $api.get('/api/sheet', { 
    //   params: { id: spreadsheetId, sheet: sheetName, limit: 5 } 
    // })
    
    const data = res.data || res
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0]
      const cols = Object.keys(row).map(key => ({
        name: key,
        format: detectFormat(row[key])
      }))
      
      rawData.value = { cols, rows: data }
    }
  } catch (e) {
    console.error('Failed to fetch sheet data', e)
  } finally {
    loadingSchema.value = false
  }
}

// Format Detection Helper
const detectFormat = (val: any) => {
  if (!isNaN(Number(val))) return 'number'
  if (typeof val === 'string' && !isNaN(Date.parse(val))) return 'date'
  return 'text'
}

// Column Management
const addColumn = (col: any) => {
  dataModel.value.config.columns.push({
    id: col.name, // Sheet columns often use header as ID
    name: col.name,
    label: col.name,
    format: col.format,
    precision: col.format === 'number' ? 0 : null,
    aggregation: null,
    datefilter: false
  })
}
const delColumn = (i: number) => dataModel.value.config.columns.splice(i, 1)

// Series Management
const addSeries = () => {
  dataModel.value.config.chart.series.push({
    field: null,
    axis: 'y',
    type: isCombine.value ? 'column' : 'auto',
    mode: 'lines'
  })
}
const delSeries = (i: number) => dataModel.value.config.chart.series.splice(i, 1)

// Submit
const submit = () => {
  // Map specific chart types to Plotly types if needed
  if (isDonut.value) dataModel.value.config.chart.type = 'pie'
  else if (isCombine.value) dataModel.value.config.chart.type = 'column' // Default, overrides per series
  
  emit('update:modelValue', dataModel.value)
  emit('submit', dataModel.value)
}
</script>