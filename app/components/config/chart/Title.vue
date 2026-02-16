<template>
  <div class="row q-col-gutter-sm items-center">
    <div class="col-grow col-12">
      <f-input v-model.number="model.fontsize" label="Font Size (px)" type="number" placeholder="Auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TitleConfig } from '~/utils/gridstack'

const props = defineProps<{ modelValue: TitleConfig | null | undefined }>()
const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue ?? { align: 'left', fontsize: undefined },
  set: (val) => emit('update:modelValue', val),
})
</script>