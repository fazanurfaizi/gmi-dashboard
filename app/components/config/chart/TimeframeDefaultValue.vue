<template>
  <f-select :col="props.col" v-model="model" :options="options" label="Default Timeframe Value" optionValue="value" :option-label="(val: any) => val.label" :required="required" />
</template>

<script setup lang="ts">
import { timeframeBased } from '~/utils/dateHelper'

const props = defineProps({
  modelValue: { type: [Number, Object] as any, default: null },
  timeframe: { type: String, default: '' },
  col: { type: String, default: '6', required: false },
  required: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const options = computed(() => {
  if (!props.timeframe) return []
  return timeframeBased[props.timeframe] || []
})

watch(() => props.timeframe, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) emit('update:modelValue', null)
})
</script>