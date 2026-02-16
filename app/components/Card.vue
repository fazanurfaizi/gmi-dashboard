<template>
  <div :class="col ? `q-pa-sm col-12 col-md-${col}` : ''">
    <q-card flat bordered>
      <slot name="top" />

      <!-- TITLE -->
      <template v-if="useTopSection">
        <q-card-section class="q-py-sm q-pb-xs q-pt-md">
          <div class="row items-center no-wrap">
            <div class="col">
              <span v-if="showTitle" class="text-h5 text-bold text-capitalize">{{ title }}</span>
              <slot name="top-section-left" />
            </div>
            <div class="col-auto">
              <slot name="top-section-right" />
            </div>
          </div>
        </q-card-section>
      </template>
      <template v-else>
        <div v-if="showTop" class="row justify-between q-px-md q-pt-md q-pb-sm">
          <div v-if="showTitle" class="text-h5 text-bold text-capitalize">
            {{ title }}
            <slot name="top-section-left" />
          </div>
          <div v-if="addButton">
            <slot name="buttons">
              <q-btn color="accent" icon="add" label="Add" @click="onAdd">
                <q-tooltip>Add Data</q-tooltip>
              </q-btn>
            </slot>
          </div>
        </div>
      </template>

      <!-- CONTENT -->
      <div :class="contentClass">
        <slot />
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  row?: boolean
  col?: string
  addButton?: boolean
  dense?: boolean
  hideTitle?: boolean
  useTopSection?: boolean
}>()

const emit = defineEmits(['addEvent'])

const contentClass = computed(() => {
  let res: string = props.row ? 'row q-px-sm q-pb-sm' : 'q-px-md q-pb-sm'
  if (props.dense) res = `${props.row ? 'row' : ''} q-pa-sm q-mt-sm`
  return res
})

const showTitle = computed(() => {
  let res: boolean = props.title ? true : false
  if (props.hideTitle) res = false
  return res
})

const showTop = computed(() => {
  let res: number = 0
  if (showTitle.value) res += 1
  if (props.addButton) res += 1
  return res > 0 ? true : false
})

const onAdd = () => {
  emit('addEvent')
}
</script>
