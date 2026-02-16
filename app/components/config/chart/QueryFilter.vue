<template>
  <div class="query-filter-config">
    <div class="row q-mb-sm items-center justify-between">
      <div class="text-subtitle2 text-grey-8">Query Filters</div>
      <q-spinner v-if="loading" color="primary" size="xs" class="q-mr-sm" />
      <q-btn v-else color="primary" icon="add" label="Add Filter" size="sm" unelevated @click="addFilter" />
    </div>

    <q-markup-table class="table-no-padding table-bordered" flat dense wrap-cells>
      <thead>
        <tr>
          <th style="width: 40px">#</th>
          <th-input>Column</th-input>
          <th-input>Operator</th-input>
          <th-input>Value</th-input>
        </tr>
      </thead>
      <tbody>
        <s-drag v-model="filters" container="tr" handle=".drag-handle">
          <template #default="{ item: v, index: i }">
            <td class="text-center">
              <div class="row no-wrap items-center justify-center">
                <q-icon name="drag_indicator" class="drag-handle cursor-pointer text-grey-5 q-mr-xs" size="xs" />
                <q-btn flat dense color="negative" icon="delete" size="sm" @click="removeFilter(i)" />
              </div>
            </td>
            <td-input :i="i" v-model="v.name" type="select" :options="effectiveColumns" option-label="name" option-value="name" @update:model-value="resetRow(v)" />
            <td-input :i="i" v-model="v.operator" type="select" :options="getOperatorOptions(v.name)" />
            <td-input v-if="v.operator === 'order'" :i="i" v-model="v.value" type="select" :options="['ASC', 'DESC']" />
            <td-input v-else :i="i" v-model="v.value" :type="getValueInputType(v.name)" />
          </template>
        </s-drag>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script setup lang="ts">
import type { FilterItem } from '~/utils/gridstack'

interface ColumnDef { name: string; format?: string; [key: string]: any }

interface Props {
  modelValue: FilterItem[]
  columns?: ColumnDef[]
  app?: string | null
  endpoint?: string | null
  operatorOptions?: { text: string[]; nontext: string[] }
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  columns: () => [],
  app: null,
  endpoint: null,
  operatorOptions: () => ({
    text: ['=', '!=', 'like', 'not like', 'in', 'not in', 'is null', 'is not null'],
    nontext: ['=', '!=', '>', '>=', '<', '<=', 'in', 'not in', 'is null', 'is not null', 'order'],
  }),
})

const emit = defineEmits(['update:modelValue'])
const $api = useApi()
const loading = ref(false)
const localColumns = ref<ColumnDef[]>([])

const filters = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const effectiveColumns = computed(() => {
  if (props.columns && props.columns.length > 0) return props.columns
  return localColumns.value
})

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

const fetchColumns = async () => {
  if (props.columns && props.columns.length > 0) return
  const { app, endpoint } = props
  if (!app || !endpoint) return
  loading.value = true
  
  try {
    const res: any = await $api.get(`${endpoint}?limit=5`)
    loading.value = false
    const d = res.data || res // Handle response wrapper

    if (d && Array.isArray(d) && d.length > 0) {
      const cols: ColumnDef[] = []
      const row = d[0]
      for (const key of Object.keys(row)) {
        if (!key) continue
        cols.push({ id: key, name: key, format: getFormat(row[key]) })
      }
      localColumns.value = cols
    }
  } catch (e) {
    loading.value = false
    console.error('Failed to fetch columns for filters', e)
  }
}

onMounted(() => { fetchColumns() })

watch(() => [props.endpoint, props.app], () => {
  if (!props.columns || props.columns.length === 0) fetchColumns()
})

const addFilter = () => {
  const newFilters = [...filters.value]
  newFilters.push({ name: null, operator: null, value: null })
  emit('update:modelValue', newFilters)
}

const removeFilter = (index: number) => {
  const newFilters = [...filters.value]
  newFilters.splice(index, 1)
  emit('update:modelValue', newFilters)
}

const resetRow = (item: FilterItem) => {
  item.operator = null
  item.value = null
}

const getOperatorOptions = (colName: string | null) => {
  if (!colName) return []
  const col = effectiveColumns.value.find((c) => c.name === colName)
  if (col && col.format === 'text') return props.operatorOptions.text
  return props.operatorOptions.nontext
}

const getValueInputType = (colName: string | null) => {
  if (!colName) return 'input'
  const col = effectiveColumns.value.find((c) => c.name === colName)
  if (col && col.format === 'number') return 'number'
  return 'input'
}
</script>