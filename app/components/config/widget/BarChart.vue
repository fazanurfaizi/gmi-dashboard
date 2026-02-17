<template>
  <div class="flex flex-col gap-4">
    <q-select
      label="X Axis (Dimension)"
      :model-value="config.dimensions?.[0]"
      :options="columns"
      @update:model-value="updateDimension"
      outlined
      dense
      options-dense
    />

    <q-select
      label="Y Axis (Metric)"
      :model-value="config.metrics?.[0]"
      :options="columns"
      @update:model-value="updateMetric"
      outlined
      dense
      options-dense
    />
    
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Line Overlay (Combo Chart)</h4>
      
      <q-select
        label="Secondary Y Axis (Metric)"
        :model-value="config.secondAxis"
        :options="columns"
        clearable
        @update:model-value="updateSecondAxis"
        outlined
        dense
        options-dense
      />
      
      <div v-if="config.secondAxis" class="mt-2">
        <label class="block text-xs font-medium text-gray-500 mb-1">Overlay Type</label>
        <select
          :value="config.secondAxisType || 'line'"
          @input="updateSecondAxisType(($event.target as HTMLSelectElement).value as any)"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="line">Line</option>
          <option value="bar">Bar</option>
        </select>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-2">
      <input
        id="stacked"
        type="checkbox"
        :checked="config.styles?.isStacked"
        @change="config.styles = { ...config.styles, isStacked: ($event.target as HTMLInputElement).checked }"
        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <label for="stacked" class="text-sm text-gray-700 dark:text-gray-300">Stack Bars</label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartConfig } from '~~/types/dashboard';

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
  config.value.dimensions = [val];
};

const updateMetric = (val: string) => {
  config.value.metrics = [val];
};

const updateSecondAxis = (val: string) => {
  config.value.secondAxis = val;
};

const updateSecondAxisType = (val: 'bar' | 'line') => {
  config.value.secondAxisType = val;
};
</script>