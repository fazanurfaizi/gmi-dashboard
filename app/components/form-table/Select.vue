<template>
  <div class="form-select-sm">
    <q-select
      dense
      v-model="selected"
      :loading="loading"
      hide-bottom-space
      borderless
      input-debounce="0"
      :readonly="readonly"
      :placeholder="placeholder"
      :input-class="inputClass"
      :mask="mask"
      :prefix="prefix"
      :hint="hint"
      use-input
      :fill-input="!autocomplete"
      map-options
      :options="select.options"
      @filter="(val, update) => filterSelect(val, update)"
      :option-value="optionValue || 'id'"
      :option-label="optionLabel || ((v) => (v.code ? `${v.code} ${v.name ? '(' + v.name + ')' : ''}` : (v.name ?? v)))"
      :emit-value="raw ? false : true"
      :clearable="showClearable"
      :multiple="multiple"
      :use-chips="useChip"
      :hide-selected="!useChip"
      @update:modelValue="emiters($event)"
      :disable="disable"
      :hide-dropdown-icon="hideDropdownIcon"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">{{ autocomplete ? 'Enter to create new' : 'No results' }}</q-item-section>
        </q-item>
      </template>
      <template v-slot:before>
        <slot name="before"></slot>
      </template>
      <template v-slot:prepend>
        <q-btn v-if="showRefresh" @click="loadSource" icon="refresh" flat size="sm" color="primary" dense round />
        <slot name="prepend"></slot>
      </template>
      <template v-slot:append>
        <slot name="append"></slot>
      </template>
      <template v-slot:after>
        <slot name="after"></slot>
      </template>

      <template v-if="$slots.option" v-slot:option="scope">
        <slot name="option" v-bind="scope"></slot>
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface Option {
  id?: string | number
  code?: string
  name?: string
  [key: string]: any
}

interface Props {
  modelValue: any
  col?: string
  boxClass?: string
  inputClass?: string
  style?: string
  label?: string
  placeholder?: string
  mask?: string
  prefix?: string
  hint?: string
  required?: boolean
  readonly?: boolean
  borderless?: boolean
  norules?: boolean
  hideBottomSpace?: boolean
  options?: Option[]
  optionValue?: string
  optionLabel?: (option: Option) => string
  multiple?: boolean
  raw?: boolean
  mustFill?: boolean
  api?: string
  app?: string
  showRefresh?: boolean
  defaultData?: any
  disable?: boolean
  hideDropdownIcon?: boolean
  hideClearable?: boolean
  autocomplete?: boolean
  uppercase?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  raw: false,
  uppercase: false,
  required: false,
  readonly: false,
  borderless: false,
  norules: false,
  hideBottomSpace: false,
  multiple: false,
  disable: false,
  hideDropdownIcon: false,
  hideClearable: false,
  autocomplete: false,
})

const emit = defineEmits(['update:modelValue', 'updateEvent', 'newValue', 'selected'])

const $api = useApi()
const loading = ref(true)
const selected = ref(props.modelValue)
const select = ref({
  options: [] as Option[],
  optionsTmp: [] as Option[],
})
const searchVal = ref<string | null>(null)

const showClearable: any = computed(() => {
  let res: any = !props.multiple && !props.mustFill ? true : false
  if (props.required) res = false
  if (props.hideClearable) res = false
  return res
})

const useChip = computed(() => {
  let res = props.multiple ? true : false
  if (props.autocomplete) res = true
  return res
})

watch(
  () => props.options,
  (newOptions) => {
    if (newOptions && (!searchVal.value || searchVal.value === '')) {
      select.value.options = select.value.optionsTmp = newOptions
    }
  }
)

watch(
  () => props.modelValue,
  (newValue) => {
    selected.value = newValue
    searchVal.value = null
  }
)

watch(
  () => props.defaultData,
  (dd) => {
    select.value.options = []
    if (dd) select.value.options.push(dd)
  }
)

const getRawSelected = (val: any) => {
  if (!val) return null

  const src = unreactive(select.value.options)
  const key = props.optionValue || 'id'
  const list = src.filter((r: any) => r[key] === val)
  if (!list.length) return null
  else return list[0]
}

const emiters = (value: any) => {
  emit('update:modelValue', value)
  emit('updateEvent', value)
  emit('selected', getRawSelected(value))
}

const filterSelect = (val: string, update: (fn: () => void) => void) => {
  searchVal.value = val
  if (val === '') {
    update(() => {
      select.value.options = select.value.optionsTmp
    })
    return
  }
  update(() => {
    const needle = val.toLowerCase()
    select.value.options = select.value.optionsTmp.filter((option) => JSON.stringify(option).toLowerCase().includes(needle))
  })
}

const loadSource = async () => {
  let options: Option[] = []
  if (props.api) {
    const endpoint = props.api.includes('?') ? `${props.api}&limit=0` : `${props.api}?limit=0`
    const res: any = await $api.get(endpoint)
    options = res
  } else if (props.options) {
    options = props.options
    if (options.length === 1 && typeof options[0] === 'string') emiters(options[0])
  }
  select.value.options = select.value.optionsTmp = options
  selected.value = props.modelValue
  loading.value = false
}

onMounted(() => {
  void loadSource()
})
</script>
