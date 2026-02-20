<template>
  <q-card flat class="bg-transparent">
    <q-form @submit="updateData">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6 text-weight-bold text-grey-8">Table Widget Configuration</div>
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

                <div class="col-12 col-md-5">
                  <q-select v-model="dataModel.config.dataSource" label="Data Source Table" :options="dataSourceOptions"
                    emit-value map-options outlined dense @update:model-value="loadTableSchema" />
                </div>

                <div class="col-12 col-md-3 flex flex-center">
                  <q-btn label="Load Columns" color="secondary" icon="view_column" unelevated class="full-width"
                    @click="loadTableSchema" :disable="!dataModel.config.dataSource" />
                </div>

                <div class="col-12">
                  <q-toggle v-model="dataModel.config.query.applyFilterExactDateEnd"
                    label="Exact Date Only (Disable date range filtering)" color="primary" dense />
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
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated class="q-pa-none">
              <q-tab-panel name="columns" class="q-pa-none">
                <div class="q-pa-md">
                  <q-markup-table flat bordered dense wrap-cells separator="cell">
                    <thead class="bg-grey-1">
                      <tr>
                        <th style="width: 50px">Action</th>
                        <markup-table-th-input>Field ID</markup-table-th-input>
                        <markup-table-th-input>Label</markup-table-th-input>
                        <markup-table-th-input>Format</markup-table-th-input>
                        <markup-table-th-input>Precision</markup-table-th-input>
                        <markup-table-th-input>Aggregation</markup-table-th-input>
                        <markup-table-th-input>Filter Date</markup-table-th-input>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="dataModel.config.columns.length === 0">
                        <td colspan="7" class="text-center text-grey-6 q-pa-md">
                          No columns selected. Please add from the available columns below.
                        </td>
                      </tr>
                      <tr v-for="(v, i) in dataModel.config.columns" :key="i">
                        <td class="text-center">
                          <q-btn flat dense round color="negative" icon="delete" size="sm" @click="delColumn(i)" />
                        </td>
                        <td class="bg-grey-1 text-grey-7">{{ v.name }}</td>
                        <markup-table-td-input :i="i" v-model="v.label" type="input" />
                        <markup-table-td-input :i="i" v-model="v.format" type="select" :options="optFormat" />

                        <markup-table-td-input v-if="v.format === 'number'" :i="i" v-model="v.precision" type="number"
                          :precision="0" />
                        <td v-else class="bg-grey-2"></td>

                        <markup-table-td-input v-if="v.format" :i="i" v-model="v.aggregation" type="select"
                          :options="optAggregation[v.format]" />
                        <td v-else class="bg-grey-2"></td>

                        <markup-table-td-input v-if="['date', 'datetime'].includes(v.format)" :i="i"
                          v-model="v.datefilter" type="checkbox" />
                        <td v-else class="bg-grey-2"></td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>

                <q-separator />

                <div class="q-pa-md">
                  <div class="row justify-between items-center q-mb-xs">
                    <div class="text-subtitle2">Available Columns (From Selected Table)</div>
                  </div>

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
                    <q-input v-model.number="dataModel.config.query.limit" label="Limit Results (Set 0 to view All)"
                      outlined dense type="number" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model="dataModel.config.query.order" label="Order By (e.g. name:ASC)" outlined dense />
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <config-chart-query-filter v-model="dataModel.config.query.filters" :columns="rawData.cols" />
              </q-tab-panel>

            </q-tab-panels>
          </q-card>
        </div>
      </div>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import type { WidgetData } from '~~/types/dashboard';
import { TABLE_SCHEMAS } from '~~/app/utils/constants';

useResizableTh()
useRowKeyboardMove()

const props = defineProps<{ modelValue: WidgetData }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const tab = ref('columns')

const dataModel = ref<WidgetData>(JSON.parse(JSON.stringify(props.modelValue)))
if (!dataModel.value.config) dataModel.value.config = { query: { filters: [] }, columns: [] } as any
if (!dataModel.value.config.query) dataModel.value.config.query = { limit: 0, order: '', filters: [] }
if (!dataModel.value.config.columns) dataModel.value.config.columns = []

const rawData = ref<{ cols: any[] }>({ cols: [] })

const optFormat = ['text', 'number', 'date', 'datetime']
const optAggregation: any = {
  number: ['', 'count', 'sum', 'avg', 'min', 'max'],
  date: ['', 'count', 'min', 'max'],
  datetime: ['', 'count', 'min', 'max'],
  text: ['', 'count']
}

const dataSourceOptions = [
  { label: 'Procurements (Pengadaan)', value: 'procurements' },
  { label: 'Installations (Jasa Instalasi)', value: 'installations' }
]

const loadTableSchema = () => {
  const selectedTable = dataModel.value.config.dataSource as string;
  if (!selectedTable || !TABLE_SCHEMAS[selectedTable]) return;
  rawData.value = { cols: TABLE_SCHEMAS[selectedTable] }
}

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

const delColumn = (i: number) => {
  dataModel.value.config.columns.splice(i, 1)
}

const updateData = () => {
  emit('update:modelValue', dataModel.value)
  emit('submit', dataModel.value)
}

onMounted(() => {
  if (dataModel.value.config.dataSource) {
    loadTableSchema()
  }
})
</script>