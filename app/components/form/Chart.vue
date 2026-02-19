<template>
  <q-card flat class="bg-transparent">
    <q-form @submit="submit">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6 text-weight-bold text-grey-8">Database Widget Configuration</div>
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
                <div class="col-12 col-md-6">
                  <q-input v-model="dataModel.title" label="Widget Title" outlined dense />
                </div>

                <div class="col-12 col-md-6">
                  <q-select v-model="dataModel.type" label="Widget Type" :options="widgetTypeOptions" emit-value
                    map-options outlined dense />
                </div>

                <div class="col-12 col-md-8">
                  <q-select v-model="dataModel.config.dataSource" label="Data Source Table" :options="[
                    { label: 'Procurements (Pengadaan)', value: 'procurements' },
                    { label: 'Installations (Jasa Instalasi)', value: 'installations' }
                  ]" emit-value map-options outlined dense @update:model-value="loadTableSchema" />
                </div>
                <div class="col-12 col-md-4 flex flex-center">
                  <q-btn label="Load Columns" color="secondary" icon="view_column" unelevated class="full-width"
                    @click="loadTableSchema" :disable="!dataModel.config.dataSource" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-card bordered flat>
            <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary"
              align="justify" narrow-indicator>
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
                      <tr v-if="dataModel.config.columns.length === 0">
                        <td colspan="6" class="text-center text-grey-6 q-pa-md">No columns selected. Please add from the
                          available columns below.</td>
                      </tr>
                      <tr v-for="(v, i) in dataModel.config.columns" :key="i">
                        <td class="text-center">
                          <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delColumn(i)" />
                        </td>
                        <td class="bg-grey-1 text-grey-7">{{ v.name }}</td>
                        <MarkupTableTdInput :i="i" v-model="v.label" />
                        <MarkupTableTdInput :i="i" v-model="v.format" type="select" :options="optFormat" />
                        <MarkupTableTdInput v-if="v.format === 'number'" :i="i" v-model="v.precision" type="number"
                          :precision="0" />
                        <td v-else class="bg-grey-2"></td>
                        <MarkupTableTdInput v-if="v.format" :i="i" v-model="v.aggregation" type="select"
                          :options="optAggregation[v.format]" />
                        <td v-else class="bg-grey-2"></td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>

                <q-separator />

                <div class="q-pa-md">
                  <div class="text-subtitle2 q-mb-xs">Available Columns (From Selected Table)</div>
                  <div class="scroll" style="max-height: 250px">
                    <q-markup-table flat bordered dense separator="cell">
                      <thead class="bg-grey-1">
                        <tr>
                          <th v-for="col in rawData.cols" :key="col.name" class="text-left">
                            <div class="row items-center no-wrap">
                              <span>{{ col.name }}</span>
                              <q-btn flat dense round icon="add_circle" color="positive" size="xs" class="q-ml-xs"
                                @click="addColumn(col)">
                                <q-tooltip>Add to Columns</q-tooltip>
                              </q-btn>
                            </div>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr v-if="rawData.cols.length === 0">
                          <td class="text-center text-grey-6 q-pa-md">Please select a table and load columns.</td>
                        </tr>

                        <tr v-else>
                          <td v-for="col in rawData.cols" :key="col.name" class="text-grey-7 text-caption">
                            Type: {{ col.format }}
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="query">
                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model.number="dataModel.config.query.limit" label="Limit Results" outlined dense
                      type="number" />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input v-model="dataModel.config.query.order" label="Order By (e.g. date:DESC)" outlined dense />
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <ConfigChartQueryFilter v-model="dataModel.config.query.filters" :columns="rawData.cols" />

              </q-tab-panel>

              <q-tab-panel name="chart" v-if="!isTable">
                <div class="row q-col-gutter-md q-mb-lg">
                  <div class="col-12 col-md-6">
                    <q-select v-model="dataModel.config.chart.x" label="X-Axis / Category Field"
                      :options="dataModel.config.columns" :optionLabel="(v) => v.label || v.name" option-value="name"
                      outlined dense map-options emit-value />
                  </div>

                  <div class="col-12 col-md-6" v-if="isDonut">
                    <q-select v-model="donutValueField" label="Value Field" :options="dataModel.config.columns"
                      :optionLabel="(v) => v.label || v.name" option-value="name" outlined dense map-options
                      emit-value />
                  </div>

                  <div class="col-12 col-md-6" v-if="!isDonut && !isSparkline">
                    <q-select v-model="dataModel.config.chart.legend" label="Legend / Grouping Field"
                      :options="dataModel.config.columns" :optionLabel="(v) => v.label || v.name" option-value="name"
                      outlined dense map-options emit-value clearable />
                  </div>
                </div>

                <div v-if="!isDonut">
                  <div class="text-subtitle2 q-mb-sm row justify-between items-center">
                    <span>Series Configuration (Y-Axis)</span>
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
                        <MarkupTableTdInput :i="i" v-model="v.field" type="select" :options="dataModel.config.columns"
                          :optionLabel="(col: any) => col.label || col.name" option-value="name" />
                        <template v-if="isCombine">
                          <MarkupTableTdInput :i="i" v-model="v.axis" type="select" :options="['y', 'y2']" />
                          <MarkupTableTdInput :i="i" v-model="v.type" type="select"
                            :options="['column', 'line', 'area', 'scatter']" />
                          <MarkupTableTdInput v-if="v.type !== 'column'" :i="i" v-model="v.mode" type="select"
                            :options="['lines', 'lines+markers', 'markers']" />
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
                <ConfigChartStyle v-model="dataModel.config.chartStyles" />
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

useResizableTh()
useRowKeyboardMove()

const props = defineProps<{ modelValue: WidgetData }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const tab = ref('columns')

const dataModel = ref<WidgetData>(JSON.parse(JSON.stringify(props.modelValue)))

if (!dataModel.value.config) dataModel.value.config = { query: { filters: [] }, columns: [], chart: { series: [] } } as any
if (!dataModel.value.config.query) dataModel.value.config.query = { limit: 0, order: '', filters: [] }
if (!dataModel.value.config.chart) dataModel.value.config.chart = { type: 'column', series: [], x: null, legend: null }
if (!dataModel.value.config.chart.series) dataModel.value.config.chart.series = []
if (!dataModel.value.config.columns) dataModel.value.config.columns = []


const widgetTypeOptions = [
  { label: 'Combine Chart (Bar/Line/Area)', value: 'combine_chart' },
  { label: 'Donut Chart', value: 'donut_chart' },
  { label: 'Waterfall Chart', value: 'waterfall_chart' },
  { label: 'Sparkline', value: 'sparkline_chart' },
  { label: 'Table', value: 'inventory' }
]

const isTable = computed(() => dataModel.value.type === 'inventory' || dataModel.value.type === 'table')
const isCombine = computed(() => ['combine_chart', 'bar_chart', 'area_chart'].includes(dataModel.value.type))
const isWaterfall = computed(() => dataModel.value.type === 'waterfall_chart')
const isDonut = computed(() => dataModel.value.type === 'donut_chart')
const isSparkline = computed(() => dataModel.value.type === 'sparkline_chart')

const tableSchemas: Record<string, { name: string, format: string }[]> = {
  procurements: [
    { name: 'id', format: 'number' },
    { name: 'year', format: 'number' },
    { name: 'status', format: 'text' },
    { name: 'no', format: 'number' },
    { name: 'projectCode', format: 'text' },
    { name: 'projectName', format: 'text' },
    { name: 'location', format: 'text' },
    { name: 'pm', format: 'text' },
    { name: 'admin', format: 'text' },
    { name: 'epc', format: 'text' },
    { name: 'notes', format: 'text' },
    { name: 'syncedAt', format: 'datetime' }
  ],
  installations: [
    { name: 'id', format: 'number' },
    { name: 'year', format: 'number' },
    { name: 'status', format: 'text' },
    { name: 'no', format: 'number' },
    { name: 'note', format: 'text' },
    { name: 'weeklyMeeting', format: 'text' },
    { name: 'projectCode', format: 'text' },
    { name: 'projectName', format: 'text' },
    { name: 'location', format: 'text' },
    { name: 'capacity', format: 'number' },
    { name: 'unit', format: 'text' },
    { name: 'pm', format: 'text' },
    { name: 'admin', format: 'text' },
    { name: 'sm', format: 'text' },
    { name: 'manpowerUpdate', format: 'text' },
    { name: 'epc', format: 'text' },
    { name: 'developer', format: 'text' },
    { name: 'roofType', format: 'text' },
    { name: 'progressData', format: 'text' }, // JSON
    { name: 'syncedAt', format: 'datetime' }
  ]
}

const rawData = ref<{ cols: any[] }>({ cols: [] })

const optFormat = ['text', 'number', 'date', 'datetime']

const optAggregation: Record<string, string[]> = {
  number: ['', 'sum', 'avg', 'min', 'max', 'count'],
  date: ['', 'min', 'max', 'count'],
  datetime: ['', 'min', 'max', 'count'],
  text: ['', 'count']
}

const loadTableSchema = () => {
  const selectedTable = dataModel.value.config.dataSource as string;
  if (!selectedTable || !tableSchemas[selectedTable]) return;
  rawData.value = { cols: tableSchemas[selectedTable] }
}

const donutValueField = computed({
  get: () => dataModel.value.config?.chart?.series?.[0]?.field || null,
  set: (val) => {
    if (!dataModel.value.config.chart.series) {
      dataModel.value.config.chart.series = [];

    }

    if (!dataModel.value.config.chart.series[0]) {
      dataModel.value.config.chart.series[0] = { field: val, axis: 'y', type: 'auto', mode: 'lines' };
    } else {
      dataModel.value.config.chart.series[0].field = val;
    }
  }
});

onMounted(() => {
  if (dataModel.value.config.dataSource) {
    loadTableSchema()
  }
})

const addColumn = (col: any) => {
  if (dataModel.value.config.columns.find((c: any) => c.name === col.name)) return;

  dataModel.value.config.columns.push({
    id: col.name,
    name: col.name,
    label: col.name,
    format: col.format,
    precision: col.format === 'number' ? 0 : null,
    aggregation: null,
    datefilter: false
  })
}

const delColumn = (i: number) => dataModel.value.config.columns.splice(i, 1)

const addSeries = () => {
  dataModel.value.config.chart.series.push({
    field: null,
    axis: 'y',
    type: isCombine.value ? 'column' : 'auto',
    mode: 'lines'
  })
}

const delSeries = (i: number) => dataModel.value.config.chart.series.splice(i, 1)

const submit = () => {
  if (isDonut.value) dataModel.value.config.chart.type = 'pie'
  else if (isCombine.value) dataModel.value.config.chart.type = 'column'

  emit('update:modelValue', dataModel.value)
  emit('submit', dataModel.value)
}

</script>