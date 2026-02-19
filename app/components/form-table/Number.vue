<template>
  <component :is="props.tr ? 'tr' : 'div'">
    <td v-if="props.td && props.label">{{ props.label }}</td>
    <component :is="props.td ? 'td' : 'div'">
      <q-input
        dense
        reverse-fill-mask
        borderless
        hide-bottom-space
        class="form-sm"
        :modelValue="onkey ? dataModel : dataFormatted"
        :style="style"
        :readonly="readonly"
        :placeholder="placeholder"
        input-class="text-right"
        :mask="mask"
        :prefix="prefix"
        @update:modelValue="emiters($event)"
        @blur="emiterBlur()"
        @keyup="onkey = true"
        @click="onkey = true"
        :outlined="props.outlined"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
      >
        <template v-slot:prepend>
          <slot name="prepend"></slot>
        </template>
        <template v-slot:append>
          <slot name="append"></slot>
        </template>
      </q-input>
    </component>
  </component>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    style?: string
    placeholder?: string
    mask?: string
    prefix?: string
    readonly?: boolean
    currency?: boolean
    free?: boolean
    precision?: number
    outlined?: boolean
    tr?: boolean
    td?: boolean
    label?: string
  }>(),
  {
    precision: 2,
  }
)

const emit = defineEmits(['update:modelValue', 'blur', 'updateEvent'])

const dataModel = ref<string | number | null>(props.modelValue)
const dataFormatted = ref<string | null>(null)
const onkey = ref(false)
const rounding = ref<number>(5)

const updateFormattedValue = () => {
  if (props.free) {
    dataFormatted.value = dataModel.value as string | null
  } else if (props.currency) {
    dataFormatted.value = formatMoney(dataModel.value)
    rounding.value = 2
  } else {
    dataFormatted.value = formatNumber(dataModel.value, props.precision)
    if (props.precision !== undefined) rounding.value = props.precision
    else rounding.value = 2
  }
}

const emiters = (e: string | number | null) => {
  let withoutSeparator = e
  if (typeof withoutSeparator == 'string') withoutSeparator = strReplace(',', '', withoutSeparator)
  withoutSeparator = safeParseFloat(withoutSeparator)
  emit('update:modelValue', withoutSeparator)
}

const safeParseFloat = (value: string | number | null, withRounding: boolean = false) => {
  if (value != null) {
    const val = parseFloat(value.toString())
    if (!isNaN(val)) {
      if (!withRounding) return val
      else {
        const factor = 10 ** rounding.value
        return Math.round(val * factor) / factor
      }
    }
  }
  return null
}

const emiterBlur = () => {
  let withoutSeparator = dataModel.value
  if (typeof withoutSeparator == 'string') withoutSeparator = strReplace(',', '', withoutSeparator)
  withoutSeparator = safeParseFloat(withoutSeparator, true)
  emit('update:modelValue', withoutSeparator)
  emit('updateEvent', withoutSeparator)
  emit('blur')
  onkey.value = false
}

watch(
  () => props.modelValue,
  (newValue) => {
    dataModel.value = newValue
    updateFormattedValue()
  }
)
updateFormattedValue()
</script>
