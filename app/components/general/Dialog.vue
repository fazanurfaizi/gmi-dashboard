<template>
  <div>
    <q-dialog 
      v-model="dataModel.show" 
      @hide="onHide()" 
      transition-show="fade" 
      transition-hide="fade" 
      backdrop-filter="blur(3px)" 
      :maximized="dataModel.maximize" 
      :persistent="dataModel.persistent"
    >
      <q-card 
        v-if="dataModel.show" 
        class="modal-card column no-wrap" 
        :style="!dataModel.maximize ? `max-width: 98vw; width: ${optimizeWidth()}; max-height: 90vh;` : ''"
      >
        <q-bar class="modal-bar full-width bg-grey-3 text-dark">
          <div class="text-bold">{{ dataModel.title }}</div>
          <q-space />
          
          <q-btn dense flat icon="minimize" @click="toggleMaximize(false)" :disable="!dataModel.maximize">
            <q-tooltip v-if="dataModel.maximize" class="bg-white text-primary">Minimize</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="crop_square" @click="toggleMaximize(true)" :disable="dataModel.maximize">
            <q-tooltip v-if="!dataModel.maximize" class="bg-white text-primary">Maximize</q-tooltip>
          </q-btn>
          
          <q-btn dense flat icon="close" v-close-popup @click="onHide()">
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>
        
        <q-separator />

        <q-card-section class="modal-body scroll full-width col" :key="renderKey">    
          <slot></slot>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { Screen } from 'quasar'
import { ref, watch, onUnmounted } from 'vue'

interface Configs {
  [props: string]: any
  show: boolean
  type?: string
  title?: string
  width?: string
  maximize?: boolean
  persistent?: boolean
}

const emits = defineEmits(['update:modelValue', 'hide'])
const props = defineProps({
  modelValue: { type: Object as () => Configs, required: true }
})

const dataModel = ref({ ...props.modelValue })
const renderKey = ref(0)

if (dataModel.value.width === undefined) dataModel.value.width = '60vw'
if (dataModel.value.persistent === undefined) dataModel.value.persistent = true

if (Screen.lt.sm) dataModel.value.maximize = true
else dataModel.value.maximize = dataModel.value.maximize || false

const optimizeWidth = () => {
  return Screen.lt.md ? '95vw' : (dataModel.value.width ?? '60vw')
}

const onHide = () => {
  dataModel.value.show = false
  emits('hide', false)
}

const toggleMaximize = (isMaximized: boolean) => {
  dataModel.value.maximize = isMaximized
  setTimeout(() => {
    renderKey.value++
  }, 300)
}

watch(
  () => props.modelValue?.show,
  (newVal) => {
    dataModel.value = { ...props.modelValue }
    if (newVal) renderKey.value++
  }
)

watch(
  () => dataModel,
  (_newVal) => {
    emits('update:modelValue', dataModel.value)
  },
  { deep: true }
)

const handlePopState = () => onHide()

watch(() => dataModel.value.show, (val) => {
  if (val) {
    history.pushState(null, '', location.href)
    window.addEventListener('popstate', handlePopState)
  } else {
    window.removeEventListener('popstate', handlePopState)
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>