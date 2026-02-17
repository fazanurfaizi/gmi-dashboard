<template>
  <component :is="props.tr ? 'tr' : 'div'">
    <td v-if="props.td && props.label">{{ props.label }}</td>
    <component :is="props.td ? 'td' : 'div'">
      <q-select
        class="form-select-sm"
        dense
        v-model="selected"
        :loading="loading"
        hide-bottom-space
        borderless
        input-debounce="0"
        :placeholder="placeholder"
        use-input
        fill-input
        map-options
        hide-selected
        :options="select.options"
        @filter="(val, update) => filterSelect(val, update)"
        :option-value="optionValue || 'id'"
        :option-label="optionLabel || ((v) => (v.code ? `${v.code} ${v.name ? '(' + v.name + ')' : ''}` : (v.name ?? v)))"
        :emit-value="raw ? false : true"
        @update:modelValue="emiters($event)"
        :hide-dropdown-icon="hideDropdownIcon"
        :clearable="props.clearable"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">No results</q-item-section>
          </q-item>
        </template>
        <template v-slot:prepend>
          <slot name="prepend"></slot>
        </template>
        <template v-slot:append>
          <slot name="append"></slot>
        </template>
        <template v-if="$slots.option" v-slot:option="scope">
          <slot name="option" v-bind="scope"></slot>
        </template>
      </q-select>
    </component>
  </component>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Option {
  id?: string | number
  code?: string
  name?: string
  [key: string]: any
}

const props = defineProps<{
  modelValue: any
  placeholder?: string
  options?: Option[]
  optionValue?: string
  optionLabel?: (option: Option) => string
  multiple?: boolean
  raw?: boolean
  api?: string
  app?: string
  clearable?: boolean
  hideDropdownIcon?: boolean
  tr?: boolean
  td?: boolean
  label?: string
}>()

const emit = defineEmits(['update:modelValue', 'updateEvent'])

const $api = useApi()
const loading = ref(true)
const selected = ref(props.modelValue)
const select = ref({
  options: [] as Option[],
  optionsTmp: [] as Option[], // Temporary storage for unfiltered options
})
const searchVal = ref<string | null>(null)

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

const emiters = (value: any) => {
  emit('update:modelValue', value)
  emit('updateEvent', value)
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
