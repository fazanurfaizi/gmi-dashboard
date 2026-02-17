<template>
  <input type="file" @change="onFileChange($event)" :accept="acceptFile" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
  imageOnly?: boolean
  accept?: any
}>()

const acceptFile = computed(() => {
  let res = '*'
  if (props.imageOnly) res = 'image/*'
  if (props.accept) res = props.accept
  return res
})

const emit = defineEmits(['update:modelValue'])

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  emit('update:modelValue', file)
}
</script>
