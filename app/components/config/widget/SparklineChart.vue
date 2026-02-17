<template>
  <div class="flex flex-col gap-4">
    <q-select
      label="X Axis (Timeline)"
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
    
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Style</label>
        <div class="flex gap-2">
            <button 
                v-for="type in ['line', 'area', 'bar']"
                :key="type"
                type="button"
                @click="updateSparklineType(type)"
                :class="[
                    'px-3 py-1 text-sm rounded-md border capitalize',
                    (config.styles?.sparklineType || 'line') === type 
                        ? 'bg-primary-50 text-primary-700 border-primary-200 ring-1 ring-primary-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
            >
                {{ type }}
            </button>
        </div>
    </div>
    
    <div>
      <label class="block text-xs text-gray-500 mb-1">Line/Bar Color</label>
      <input 
        type="color" 
        :value="config.styles?.colorPalette?.[0] || '#2196F3'"
        @input="config.styles = { ...config.styles, colorPalette: [($event.target as HTMLInputElement).value] }"
        class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0.5"
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

const updateSparklineType = (val: any) => {
  config.value.styles = { ...config.value.styles, sparklineType: val };
};
</script>