<template>
  <div class="col-12 q-pt-sm">
    <div class="text-subtitle2 text-grey-8 q-mb-sm">Chart Configuration</div>
    <div class="row">
      <div class="col-12">
        <q-select v-model="model.options.barMode" label="Bar Mode" :options="['group', 'stack', 'overlay', 'relative']" dense outlined bg-color="white" />
      </div>
    </div>

    <q-card flat bordered>
      <q-markup-table class="table-no-padding table-bordered" flat dense wrap-cells>
        <thead>
          <tr>
            <th class="text-left" style="width: 15%">Type</th>
            <th class="text-left" style="width: 20%">Font Size</th>
            <th class="text-left" style="width: 25%">Pos</th>
            <th class="text-left" style="width: 20%">Angle</th>
            <th class="text-center" style="width: 20%">Show/Hide</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in tableRows" :key="row.key">
            <td class="text-weight-medium">{{ row.label }}</td>
            <markup-table-td-input :i="idx" v-model.number="model[row.key].fontsize" type="number" :disable="!model[row.key].show" />
            <markup-table-td-input v-if="row.hasPos" :i="idx" v-model="model[row.key].position" type="select" :options="row.posOptions" :disable="!model[row.key].show" />
            <td v-else class="bg-grey-2 text-center">-</td>
            <markup-table-td-input v-if="row.hasAngle" :i="idx" v-model.number="model[row.key].tickangle" type="number" :disable="!model[row.key].show" />
            <td v-else class="bg-grey-2 text-center">-</td>
            <td class="text-center">
              <q-toggle v-model="model[row.key].show" dense size="sm" color="primary" />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>
  </div>
</template>

<script setup lang="ts">
useRowKeyboardMove()

const props = defineProps<{ modelValue: any }>()
const emit = defineEmits(['update:modelValue'])

const tableRows = [
  { key: 'xaxis', label: 'X-axis', hasAngle: true, hasPos: false },
  { key: 'yaxis', label: 'Y-Axis', hasAngle: false, hasPos: false },
  { key: 'y2axis', label: 'Y2-Axis', hasAngle: false, hasPos: false },
  { key: 'legend', label: 'Legend', hasAngle: false, hasPos: true, posOptions: ['top', 'right', 'bottom', 'left'] },
  { key: 'labels', label: 'Labels', hasAngle: false, hasPos: true, posOptions: ['auto', 'inside', 'outside'] },
  { key: 'lineLabels', label: 'Line Labels', hasAngle: false, hasPos: false }
]

const model = computed({
  get: () => {
    const val = props.modelValue || {}
    if (!val.xaxis) val.xaxis = { show: true, fontsize: null, tickangle: null }
    if (!val.yaxis) val.yaxis = { show: true, fontsize: null }
    if (!val.y2axis) val.y2axis = { show: false, fontsize: null }
    if (!val.legend) val.legend = { show: true, position: 'top', fontsize: null }
    if (!val.labels) val.labels = { show: true, position: 'auto', fontsize: null }
    if (!val.lineLabels) val.lineLabels = { show: true, fontsize: null }
    if (!val.title) val.title = { align: 'left' }
    if (!val.options) val.options = { barMode: 'group', lineDash: 'solid' }
    return val
  },
  set: (val) => emit('update:modelValue', val),
})

watch(model, (val) => emit('update:modelValue', val), { deep: true })
</script>