<template>
  <div class="flex flex-col gap-4">
    <q-select
      label="Labels (Dimension)"
      :model-value="config.dimensions?.[0]"
      :options="columns"
      @update:model-value="updateDimension"
      outlined
      dense
      options-dense
    />

    <q-select
      label="Values (Metric)"
      :model-value="config.metrics?.[0]"
      :options="columns"
      @update:model-value="updateMetric"
      outlined
      dense
      options-dense
    />
    
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hole Size ({{ config.styles?.holeSize || 0.5 }})
        </label>
        <input 
            type="range" 
            min="0.1" 
            max="0.9" 
            step="0.1"
            :value="config.styles?.holeSize || 0.5"
            @input="updateHoleSize(($event.target as HTMLInputElement).value)"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
    </div>

    <div class="flex items-center gap-2 mt-2">
      <q-checkbox
        :model-value="config.styles?.showLegend !== false"
        @update:model-value="(val) => config.styles = { ...config.styles, showLegend: val }"
        label="Show Legend"
        dense
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ChartConfig } from '~~/types/dashboard';

const props = defineProps<{
  modelValue: ChartConfig;
  columns: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ChartConfig): void;
}>();

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const updateDimension = (val: string) => {
  if (val) config.value.dimensions = [val];
};

const updateMetric = (val: string) => {
  if (val) config.value.metrics = [val];
};

const updateHoleSize = (val: string) => {
    config.value.styles = { ...config.value.styles, holeSize: parseFloat(val) };
};
</script>