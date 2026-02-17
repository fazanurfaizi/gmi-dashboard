<template>
  <div class="col-12 q-pt-sm">
    <div class="text-subtitle2 text-grey-8">Color Palette</div>
    <div class="row">
      <template v-for="(item, index) in model" :key="index">
        <div v-if="isVisible(item)" class="q-pa-sm col-12 col-md-6">
          <q-card flat bordered class="q-pa-sm">
            <div class="q-pa-sm text-bold">{{ getLabel(item) }}</div>
            <q-color v-model="item.color" label="Color" />
          </q-card>
        </div>
      </template>
    </div>
    <div v-if="model.length === 0" class="column">
      <div class="text-caption text-grey-6 text-center q-pa-sm border-dashed">No specific colors defined. Default chart colors will be used.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorSeries, MaterialType } from '~~/types/dashboard';

const props = defineProps<{ modelValue: ColorSeries[] | undefined; material?: MaterialType }>()
const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue ?? [],
  set: (val) => emit('update:modelValue', val),
})

const isVisible = (item: { code: string; child?: string; material?: string }) => {
  if (!props.material) return true
  if (item.child === props.material) return true
  if (item.code === props.material) return true
  return false
}

const getLabel = (item: { code: string; child?: string }) => {
  if (item.child === 'OB' || item.child === 'CG') return `Series Name: ${item.code}`
  if (item.child) {
    const source = item.child === 'rit' ? 'RITS' : (item.child === 'survey' ? 'SURVEY' : item.child.toUpperCase())
    return `BY ${source}`
  }
  return `Series Name: ${item.code}`
}
</script>

<style scoped>
.border-dashed {
  border: 1px dashed #ddd;
  border-radius: 4px;
}
</style>