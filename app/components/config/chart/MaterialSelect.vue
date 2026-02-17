<template>
  <q-select :col="props.col" v-model="model" :options="options" label="Material" :required="required" />
</template>

<script setup lang="ts">
import type { MaterialType } from '~~/types/dashboard';

const props = defineProps({
  modelValue: { type: String as PropType<MaterialType | null>, default: null },
  required: { type: Boolean, default: true },
  col: { type: String, default: '6', required: false },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const options = [{ name: 'Coal Getting', id: 'CG' }, { name: 'Overburden', id: 'OB' }]
</script>