<template>
  <div class="flex flex-col gap-4">
    <q-select
      label="X Axis"
      :model-value="config.dimensions?.[0]"
      :options="columns"
      @update:model-value="updateDimension"
      outlined
      dense
      options-dense
    />

    <q-select
      label="Y Axis"
      :model-value="config.metrics?.[0]"
      :options="columns"
      @update:model-value="updateMetric"
      outlined
      dense
      options-dense
    />
    
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line Shape</label>
        <select
          :value="config.styles?.lineShape || 'linear'"
          @input="updateLineShape(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="linear">Linear (Straight)</option>
          <option value="spline">Spline (Curved)</option>
          <option value="hv">Step (H-V)</option>
          <option value="vh">Step (V-H)</option>
        </select>
    </div>

    <div class="flex items-center gap-2 mt-2">
      <q-checkbox
        :model-value="config.styles?.showMarkers"
        @update:model-value="(val) => config.styles = { ...config.styles, showMarkers: val }"
        label="Show Points"
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

const updateLineShape = (val: any) => {
  config.value.styles = { ...config.value.styles, lineShape: val };
};
</script>