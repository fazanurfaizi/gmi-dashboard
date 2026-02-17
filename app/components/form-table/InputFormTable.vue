<template>
  <component :is="props.tr ? 'tr' : 'div'">
    <td v-if="props.td && props.label">{{ props.label }}</td>
    <component :is="props.td ? 'td' : 'div'">
      <q-input dense :modelValue="modelValue" :style="style" class="form-sm" borderless :readonly="readonly" :placeholder="placeholder" :mask="mask" :prefix="prefix" @update:modelValue="emiters($event)" @blur="emiterBlur" :outlined="props.outlined" autocomplete="off" autocorrect="off" spellcheck="false">
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
const props = defineProps<{
  modelValue: string | number | null | undefined
  style?: string
  placeholder?: string
  mask?: string
  prefix?: string
  readonly?: boolean
  outlined?: boolean
  label?: string
  tr?: boolean
  td?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'blur'])

const emiters = (e: string | number | null) => {
  emit('update:modelValue', e)
}

const emiterBlur = () => {
  emit('blur')
}
</script>
