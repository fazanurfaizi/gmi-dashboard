<template>
  <q-skeleton v-if="props.skeleton" :height="props.height ?? '150px'" syle="width:100%;" />
  <div v-else class="q-pl-lg q-pr-lg">
    <q-inner-loading :showing="true">
      <q-spinner size="50px" :thickness="4" color="primary" />
      <slot></slot>
      {{ label }}
    </q-inner-loading>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  skeleton?: boolean
  height?: string
  label?: string
}>()
</script>
