<template>
  <div>
    <q-form @submit="updateData()">
      <div class="row justify-end q-mb-md q-gutter-sm">
        <q-btn label="Cancel" flat v-close-popup />
        <q-btn type="submit" color="positive" label="Update Widget" />
      </div>

      <q-input v-model="dataModel.title" label="Title" class="q-mb-sm" />
      <div class="bg-grey-1 q-pa-md rounded-borders border-grey-light">
        <div class="row">
          <div class="col-12 col-md-6">
            <q-item tag="label" class="q-pa-none" v-ripple>
              <q-item-section avatar>
                <q-toggle v-model="dataModel.config.query.applyFilterExactDateEnd" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Exact Date Only</q-item-label>
                <q-item-label caption>Disable date range filtering</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </div>

      <div class="q-ma-sm form-title">Module</div>
      <spinner-loading skeleton v-if="loading" />
      <div v-else class="col-12 row">
        <div class="col-12 col-md-6">
          <q-select v-model="dataModel.config.app" label="App" :options="Object.keys(opt.modules)" />
        </div>
        <div class="col-12 col-md-6">
          <q-select v-model="dataModel.config.endpoint" label="Module" :options="moduleApp" @update:modelValue="getColumns()" />
        </div>
      </div>

      <div class="q-my-md q-px-sm row justify-between">
        <div class="form-title">Config</div>
        <q-tabs v-model="tab" :tabs="tabs" />
      </div>

      <template v-if="tab == 'columns'">
        <div class="q-px-sm subtitle">Columns</div>
        <q-markup-table class="q-pa-sm table-no-padding table-bordered" flat dense wrap-cells>
          <thead>
            <tr>
              <markup-table-th-input>#</markup-table-th-input>
              <markup-table-th-input>Id</markup-table-th-input>
              <markup-table-th-input>Label</markup-table-th-input>
              <markup-table-th-input>Format</markup-table-th-input>
              <markup-table-th-input>Precision</markup-table-th-input>
              <markup-table-th-input>Aggregation</markup-table-th-input>
              <markup-table-th-input>Filter Date</markup-table-th-input>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in dataModel.config.columns" :key="i">
              <td class="text-center">
                <q-btn flat dense color="negative" icon="delete" @click="delColumn(v, i)" />
              </td>
              <td>{{ v.id = `${v.name}${i}` }}</td>
              <markup-table-td-input :i="i" v-model="v.label" type="input" />
              <markup-table-td-input :i="i" v-model="v.format" type="select" :options="optFormat" />
              <markup-table-td-input v-if="v.format == 'number'" :i="i" v-model="v.precision" type="number" :precision="0" />
              <td v-else class="bg-grey-3"></td>
              <markup-table-td-input v-if="v.format" :i="i" v-model="v.aggregation" type="select" :options="optAggregation[v.format]" />
              <markup-table-td-input v-if="['date', 'datetime'].includes(v.format)" :i="i" v-model="v.datefilter" type="checkbox" />
              <td v-else class="bg-grey-3"></td>
            </tr>
          </tbody>
        </q-markup-table>

        <div class="q-ma-sm subtitle">
          <div class="row items-center">
            <div>Preview Data</div>
            <q-btn flat dense icon="refresh" @click="getColumns()">
              <q-tooltip>Refresh Column</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="q-px-sm">
          <q-markup-table class="q-pb-md table-no-padding table-bordered" flat dense>
            <thead>
              <tr>
                <th v-for="col in rawData.cols" :key="col">
                  {{ col.name }}
                  <q-btn flat dense icon="add" @click="addColumn(col)">
                    <q-tooltip>Add Column</q-tooltip>
                  </q-btn>
                </th>
              </tr>
            </thead>
            <tbody v-if="loadColumns">
              <tr>
                <td :colspan="rawData.cols?.length ?? 1">
                  <spinner-loading skeleton />
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="r in rawData.rows" :key="r">
                <td v-for="col in rawData.cols" :key="col">
                  {{ r[col.id] }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </template>

      <template v-if="tab == 'query'">
        <div class="q-ma-sm subtitle">Queries</div>
        <div class="row">
          <div class="col-12 col-md-6">
            <q-input v-model="dataModel.config.query.limit" label="Limit (Set 0 to view All)" :precision="0" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="dataModel.config.query.order" label="Order By (name:ASC/DESC)" />
          </div>
        </div>
        <div class="q-px-sm">
          <q-btn color="primary" icon="add" label="Add Filters" @click="addQueryFilter()" />
          <q-markup-table class="q-pb-md table-no-padding table-bordered" flat dense wrap-cells>
            <thead>
              <tr>
                <th>#</th>
                <markup-table-th-input>Column</markup-table-th-input>
                <markup-table-th-input>Operator</markup-table-th-input>
                <markup-table-th-input>Value</markup-table-th-input>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, i) in dataModel.config.query.filters" :key="i">
                <td class="text-center"><q-btn flat dense color="negative" icon="delete" @click="delQueryFilter(v, i)" /></td>
                <markup-table-td-input :i="i" v-model="v.name" type="select" :options="rawData.cols" />
                <markup-table-td-input :i="i" v-model="v.operator" type="select" :options="getOptOperator(v.name)" />
                <markup-table-td-input v-if="v.operator == 'order'" :i="i" v-model="v.value" type="select" :options="['ASC', 'DESC']" />
                <markup-table-td-input v-else :i="i" v-model="v.value" :type="getColType(v.name)" />
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </template>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
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
const tabs = ['columns', 'query']
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
    const d = res.data || res
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

const addQueryFilter = () => {
  if (!dataModel.value.config.query.filters) dataModel.value.config.query.filters = []
  dataModel.value.config.query.filters.push({ name: null, operator: null, value: null })
}

const delQueryFilter = (_v: any, i: number) => { if (dataModel.value.config.query.filters) dataModel.value.config.query.filters.splice(i, 1) }

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

const getOptOperator = (name: string | number | null) => {
  const row = rawData.value.cols.find((v: any) => v.name == name)
  if (row && row.format == 'text') return opt.value.queries.text
  else return opt.value.queries.text
}

const getColType = (name: string | number | null) => {
  const row = rawData.value.cols.find((v: any) => v.name == name)
  if (row && row.format == 'number') return 'number'
  else return 'input'
}

const moduleApp = computed(() => dataModel.value?.config?.app ? opt.value.modules[dataModel.value?.config?.app] : [])

onMounted(async () => {
  await getOpt(`${Meta.module}?opt=true`)
  getColumns()
  loading.value = false
})
</script>