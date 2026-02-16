<template>
  <div class="col-12 q-pt-sm">
    <div class="text-subtitle2 text-grey-8">Additional Axis</div>
    <div class="row">
      <div v-for="(axis, index) in model" :key="index" class="q-pa-sm col-12 col-md-6">
        <q-card flat bordered class="q-pa-sm">
          <div class="q-pa-sm row items-center justify-between">
            <div class="text-bold text-capitalize">{{ axis.name }}</div>
            <div class="col-auto">
              <q-checkbox :model-value="axis.show" @update:model-value="(val: boolean) => update(index, 'show', val)" label="Show" dense />
            </div>
          </div>
          <q-select :model-value="axis.type" :options="typeOptions" @update:model-value="(val: any) => update(index, 'type', val)" label="Axis Type" required :readonly="!axis.show" />
          <q-color :model-value="axis.color" @update:model-value="(val: any) => update(index, 'color', val)" label="Color" :readonly="!axis.show" />
          <q-select :model-value="axis.lineDash" :options="dashOptions" @update:model-value="(val: any) => update(index, 'lineDash', val)" label="Line Dash" :readonly="!axis.show" />
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdditionalAxisConfig } from '~/utils/gridstack'

const props = defineProps({
  modelValue: { type: Array as PropType<AdditionalAxisConfig[] | null | undefined>, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const model = computed(() => props.modelValue ?? [])

const update = (index: number, key: keyof AdditionalAxisConfig | 'lineDash', val: any) => {
  const newArray = [...model.value]
  const current = newArray[index] ?? { type: 'line', name: '', color: '', show: true, lineDash: 'solid' }
  newArray[index] = { ...current, [key]: val }
  emit('update:modelValue', newArray)
}

const typeOptions = [{ name: 'Line', id: 'line' }, { name: 'Area', id: 'area' }]
const dashOptions = ['solid', 'dot', 'dash', 'longdash', 'dashdot']
</script>