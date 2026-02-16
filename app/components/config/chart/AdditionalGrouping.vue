<template>
  <div class="col-12 q-pt-sm">
    <div class="text-subtitle2 text-grey-8">Additional Grouping By</div>
    <q-select label="Name" v-model="model.name" :options="optName" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const model = reactive({ type: 'stack', name: null })
const optName = ['company', 'vendor', 'location_origin', 'location_destination']

watch(() => props.modelValue, (v) => {
  if (v) Object.assign(model, v)
}, { immediate: true })

watch(model, (v) => emit('update:modelValue', { ...v }), { deep: true })
</script>