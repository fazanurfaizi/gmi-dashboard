<template>
  <f-select :col="props.col" v-model="model" :options="options" label="Timeframe" :required="required" />
</template>

<script setup lang="ts">
import type { ChartTimeframe } from '~/utils/gridstack'

const props = defineProps({
  modelValue: { type: String as PropType<ChartTimeframe | null>, default: null },
  col: { type: String, default: '6', required: false },
  required: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const options = [
  { name: 'Daily', id: 'daily' },
  { name: 'Monthly', id: 'monthly' },
  { name: 'Yearly', id: 'yearly' },
]
</script>