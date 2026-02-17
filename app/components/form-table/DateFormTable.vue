<template>
  <component :is="props.tr ? 'tr' : 'div'">
    <td v-if="props.td && props.label">{{ props.label }}</td>
    <component :is="props.td ? 'td' : 'div'">
      <q-input dense v-model="dataModel" class="form-sm" borderless hide-bottom-space :style="props.style" :readonly="props.readonly" :placeholder="props.placeholder" :mask="masking" :prefix="props.prefix" @blur="emiters(dataModel, $event)" @update:modelValue="directUpdate(dataModel)" @keydown.enter.prevent="handleEnter(dataModel)">
        <template v-slot:hint>
          <slot name="hint"></slot>
        </template>

        <template v-slot:append>
          <q-icon v-if="!time" size="xs" name="event" class="cursor-pointer">
            <q-popup-proxy v-model="popupDate" ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date v-if="range" v-model="rangeDate" :mask="maskDate" @update:modelValue="setDateRangeValue(rangeDate)" range />
              <q-date v-else v-model="dataModel" :mask="maskDate" default-view="Calendar" @update:modelValue="emiters($event)" @navigation="handlerNav" />
            </q-popup-proxy>
          </q-icon>

          <q-icon v-if="time || datetime" size="xs" name="access_time" class="cursor-pointer">
            <q-popup-proxy ref="qTimeProxy" transition-show="scale" transition-hide="scale">
              <q-time v-model="dataModel" @update:modelValue="emiters($event)" :mask="maskDate" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </component>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface RangeDate {
  from: string
  to: string
}

const props = defineProps<{
  modelValue: string | number | null
  col?: string
  boxClass?: string
  inputClass?: string
  style?: string
  label?: string
  placeholder?: string
  prefix?: string
  hint?: string
  required?: boolean
  readonly?: boolean
  borderless?: boolean
  norules?: boolean
  range?: boolean
  datetime?: boolean
  millis?: boolean
  time?: boolean
  yearMonth?: boolean
  hideBottomSpace?: boolean
  emitValue?: boolean
  tr?: boolean
  td?: boolean
}>()

const emits = defineEmits(['update:modelValue', 'enterEvent', 'updateRange'])

const rangeDate = ref<RangeDate | null>(null)
const dataModel = ref<string | null>(null)
const popupDate = ref(false)

const masking = computed(() => {
  if (props.datetime) return '####-##-## ##:##'
  if (props.millis) return '####-##-## ##:##'
  if (props.time) return '##:##'
  if (props.range) return ''
  if (props.yearMonth) return 'SSS ####'
  return '####-##-##'
})

const maskDate = computed(() => {
  if (props.datetime) return 'YYYY-MM-DD HH:mm'
  if (props.millis) return 'YYYY-MM-DD HH:mm'
  if (props.time) return 'HH:mm'
  if (props.yearMonth) return 'MMM YYYY'
  return 'YYYY-MM-DD'
})

const init = () => {
  let date = ''
  if (props.modelValue) {
    if (props.range) {
      if (typeof props.modelValue === 'string') {
        const split = props.modelValue.split(' to ')
        if (split[1] !== undefined) {
          const from = split[0]
          const to = split[1]
          if (from && to) {
            const dateStart = toDate(from, 'YYYY-MM-DD')
            const dateEnd = toDate(to, 'YYYY-MM-DD')
            date = `${dateStart} to ${toDate}`
            rangeDate.value = { from: dateStart, to: dateEnd }
          }
        }
      }
    } else if (props.yearMonth) date = toDate(props.modelValue, 'MMM YYYY')
    else if (props.datetime) date = toDate(props.modelValue, 'YYYY-MM-DD HH:mm')
    else if (props.millis) date = toDate(props.modelValue, 'YYYY-MM-DD HH:mm')
    else if (props.time === undefined) date = toDate(props.modelValue, 'YYYY-MM-DD')
    else date = props.modelValue.toString()
  }
  dataModel.value = date
}

const handlerNav = (e: any) => {
  if (!e.year && !e.month) (globalThis as any).$refs.qDateProxy.hide()
}

const emiters = (e: any, event: any = null) => {
  let doupdate = false
  if (!event) {
    doupdate = true
  } else if (event && event.relatedTarget) {
    doupdate = true
  } else if (event && event.relatedTarget == null) {
    doupdate = false
  }

  if (doupdate) {
    let value = e
    if (props.millis) value = date2millis(e)
    if (props.yearMonth) value = ym2date(e)
    if (value == '') value = null
    emits('update:modelValue', value)
  }
}

const directUpdate = (e: any) => {
  if (props.emitValue) {
    if (e == '') e = null
    emits('update:modelValue', e)
  }
}

const handleEnter = (e: any) => {
  let value = e
  if (props.millis) value = date2millis(e)
  if (props.yearMonth) value = ym2date(e)
  if (value == '') value = null
  emits('update:modelValue', value)
  emits('enterEvent', value)
}

const setDateRangeValue = (val: any) => {
  if (val) {
    emits('updateRange', val)
    let value
    if (typeof val === 'string') {
      value = val
      dataModel.value = value
    } else {
      let from = val.from
      let to = val.to
      if (props.millis) {
        from = date2millis(val.from, true)
        to = date2millis(val.to, true) + 86399000
      }
      value = `${from} to ${to}`
      dataModel.value = `${val.from} to ${val.to}`
    }
    emiters(value)
  }
}

watch(() => props.modelValue, init)

onMounted(init)
</script>
