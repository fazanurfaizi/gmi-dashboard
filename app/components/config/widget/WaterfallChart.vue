<template>
  <div class="flex flex-col gap-4">
    <q-select
      label="X Axis (Category)"
      :model-value="config.dimensions?.[0]"
      :options="columns"
      @update:model-value="updateDimension"
      outlined
      dense
      options-dense
    />

    <q-select
      label="Y Axis (Value)"
      :model-value="config.metrics?.[0]"
      :options="columns"
      @update:model-value="updateMetric"
      outlined
      dense
      options-dense
    />
    
    <q-select
      label="Measure Column (Optional)"
      hint="Column defining 'relative', 'total', 'absolute'"
      :model-value="config.measureColumn"
      :options="columns"
      clearable
      @update:model-value="updateMeasureColumn"
      outlined
      dense
      options-dense
    />

    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 grid grid-cols-2 gap-2">
        <h4 class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colors</h4>
        
        <div>
          <label class="block text-xs text-gray-500 mb-1">Increasing</label>
          <input 
            type="color" 
            :value="config.styles?.increasingColor || '#2E7D32'"
            @input="config.styles = { ...config.styles, increasingColor: ($event.target as HTMLInputElement).value }"
            class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0.5"
          />
        </div>
        
        <div>
          <label class="block text-xs text-gray-500 mb-1">Decreasing</label>
          <input 
            type="color" 
            :value="config.styles?.decreasingColor || '#D32F2F'"
            @input="config.styles = { ...config.styles, decreasingColor: ($event.target as HTMLInputElement).value }"
            class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0.5"
          />
        </div>

         <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Total</label>
          <input 
            type="color" 
            :value="config.styles?.totalColor || '#1976D2'"
            @input="config.styles = { ...config.styles, totalColor: ($event.target as HTMLInputElement).value }"
            class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0.5"
          />
        </div>
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

const updateMeasureColumn = (val: string | null) => {
  config.value.measureColumn = val || undefined;
};
</script>