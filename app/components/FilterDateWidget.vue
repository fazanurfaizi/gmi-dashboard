<template>
  <q-btn v-if="label" flat dense color="primary" size="xs" :label="label" readonly />
  <template v-for="b in buttons" :key="b.value">
    <q-btn :color="b.value == model ? 'primary' : 'secondary'" :flat="b.value != model" dense size="xs" :label="b.label" @click="onFilter(b.value)" />
  </template>
</template>

<script setup lang="ts">
import { timeframeBased, buildRange, diffDates } from '~/utils/dateHelper'

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue', 'onFilter'])

const timeframe = props.modelValue?.config?.timeframe || 'daily'
const buttons = ref<any>([])
const model = ref<number | null>(null)
const dataModel = computed({
  get: () => props.modelValue,
  set: (val) => emits('update:modelValue', val),
})

const init = () => {
  const dates = dataModel.value?.dates
  if (timeframe && ['daily', 'monthly', 'yearly'].includes(timeframe)) buttons.value = timeframeBased[timeframe]

  if (dataModel.value.filterValue !== undefined) {
    model.value = dataModel.value.filterValue
    return
  }

  if (!dates?.from || !dates?.to) return
  if (buttons.value[0] == undefined) return

  const diff = diffDates(dates.from, dates.to)
  if (timeframe === 'yearly') model.value = diff.years || 1
  else if (timeframe === 'monthly') model.value = diff.years == 0 ? null : diff.months
  else model.value = diff.days + 1

  if (['monthly', 'daily'].includes(timeframe) && model.value && model.value > buttons.value[0].value) {
    model.value = buttons.value[0].value
    dataModel.value.dates = buildRange(dates.to, timeframe, model.value)
  }
}

const onFilter = (val: number | null) => {
  model.value = val
  dataModel.value.filterValue = val
  const end = dataModel.value?.dates?.to ?? new Date()
  dataModel.value.dates = buildRange(end, timeframe, val || 1)
  emits('onFilter', dataModel.value)
}

const label = computed(() => {
  const exists = buttons.value.some((e: { value: number }) => e.value === model.value)
  if (exists) return null
  if (timeframe === 'yearly') return model.value + ' year'
  if (timeframe === 'monthly') return model.value + ' month'
  return model.value + ' day'
})

onMounted(init)
</script>